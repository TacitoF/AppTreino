from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import gspread
from gspread.exceptions import APIError
from google.oauth2.service_account import Credentials
from datetime import date, datetime, timedelta
import json
import time
import asyncio
import logging
import threading
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── FILA DE ESCRITA EM LOTE (BUFFER) ──────────────────────────────────────────
# Guarda todas as interações num buffer em memória e envia para o Google Sheets
# de 15 em 15 segundos para evitar limites de API (Erro 429) e lentidão.
_fila_escrita = []
_fila_lock = threading.Lock()

def agendar_escrita(acao: str, dados: any):
    with _fila_lock:
        _fila_escrita.append({"acao": acao, "dados": dados})

async def worker_fila_escrita():
    while True:
        await asyncio.sleep(15)  # Acorda a cada 15 segundos
        if not _fila_escrita:
            continue

        with _fila_lock:
            # Copia e esvazia a fila instantaneamente
            lote = _fila_escrita[:]
            _fila_escrita.clear()

        try:
            ws = get_ws("Series_Exercicios")

            # 1. PROCESSAR INSERÇÕES (Em Lote)
            inserts = [item["dados"] for item in lote if item["acao"] == "insert"]
            if inserts:
                logger.info(f"Gravando {len(inserts)} séries em lote no Sheets...")
                com_retry(lambda: ws.append_rows(inserts, value_input_option="RAW"))

            # 2. PROCESSAR MUDANÇAS DE NOME (Em Lote)
            renames = [item["dados"] for item in lote if item["acao"] == "rename"]
            if renames:
                todas = com_retry(lambda: ws.get_all_values())
                updates = []
                for ren in renames:
                    for i, row in enumerate(todas, start=1):
                        if row and row[0] in ren["ids"]:
                            updates.append({"range": f"C{i}", "values": [[ren["novo_nome"]]]})
                if updates:
                    logger.info(f"Atualizando nome de {len(updates)} séries no Sheets...")
                    com_retry(lambda: ws.batch_update(updates))

            # 3. PROCESSAR EXCLUSÕES (Uma a uma, pois os índices mudam)
            deletes = [item["dados"] for item in lote if item["acao"] == "delete"]
            if deletes:
                logger.info(f"Deletando {len(deletes)} séries do Sheets...")
                for id_serie in deletes:
                    try:
                        cel = com_retry(lambda: ws.find(id_serie, in_column=1))
                        if cel:
                            com_retry(lambda: ws.delete_rows(cel.row))
                    except Exception:
                        pass # Ignora se a série já não estiver lá

        except Exception as e:
            logger.error(f"Erro grave no flush da fila (salvando de volta no buffer): {e}")
            # Em caso de quebra de internet do servidor, devolvemos pra fila para não perder dados
            with _fila_lock:
                _fila_escrita = lote + _fila_escrita


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Executa quando o servidor liga
    task = asyncio.create_task(worker_fila_escrita())
    yield
    # Executa quando o servidor desliga
    task.cancel()

app = FastAPI(title="FitApp API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── GOOGLE SHEETS ─────────────────────────────────────────────────────────────
scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]
credentials = Credentials.from_service_account_file("credentials.json", scopes=scopes)
gc = gspread.authorize(credentials)
planilha = gc.open("App Treinos")

_ws_cache: dict = {}

def get_ws(nome: str):
    if nome not in _ws_cache:
        _ws_cache[nome] = planilha.worksheet(nome)
    return _ws_cache[nome]


def com_retry(fn, tentativas=4, espera_inicial=1.0):
    espera = espera_inicial
    for i in range(tentativas):
        try:
            return fn()
        except APIError as e:
            codigo = e.response.status_code if hasattr(e, 'response') else 0
            if codigo == 429:
                time.sleep(espera)
                espera *= 2
            else:
                raise
        except Exception as e:
            raise
    raise HTTPException(status_code=429, detail=f"Limite Google atingido. Tente em {int(espera)}s.")


_mem_cache: dict = {}
CACHE_TTL = { "Usuarios": 300, "Treinos": 120 }

def cache_get(key: str):
    entry = _mem_cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL.get(key, 60):
        return entry["data"]
    return None

def cache_set(key: str, data):
    _mem_cache[key] = {"data": data, "ts": time.time()}

def cache_del(key: str):
    _mem_cache.pop(key, None)

def get_records(nome_aba: str) -> list:
    cached = cache_get(nome_aba)
    if cached is not None:
        return cached
    data = com_retry(lambda: get_ws(nome_aba).get_all_records())
    cache_set(nome_aba, data)
    return data


# ── CACHE LOCAL DE SÉRIES ATIVAS ──────────────────────────────────────────────
_series_cache: dict = {}         
_series_cache_ts: dict = {}      
SERIES_CACHE_TTL = 3600           

def series_cache_get(chave: str) -> Optional[list]:
    ts = _series_cache_ts.get(chave)
    if ts and (time.time() - ts) < SERIES_CACHE_TTL:
        return _series_cache.get(chave)
    return None

def series_cache_set(chave: str, series: list):
    _series_cache[chave] = series
    _series_cache_ts[chave] = time.time()

def series_cache_append(chave: str, serie: dict):
    if chave not in _series_cache:
        _series_cache[chave] = []
    _series_cache[chave].append(serie)
    _series_cache_ts[chave] = time.time()

def series_cache_remove(id_serie: str):
    for chave in list(_series_cache.keys()):
        _series_cache[chave] = [s for s in _series_cache[chave] if s.get("ID_Serie") != id_serie]


# ── ARQUIVAMENTO AUTOMÁTICO ───────────────────────────────────────────────────
ARCHIVE_DAYS = 90   
_ultimo_arquivamento: float = 0
ARCHIVE_INTERVAL = 3600 * 6   

def arquivar_series_antigas():
    global _ultimo_arquivamento
    agora = time.time()
    if agora - _ultimo_arquivamento < ARCHIVE_INTERVAL:
        return

    _ultimo_arquivamento = agora
    logger.info("Iniciando arquivamento de séries antigas...")

    try:
        ws_ativas  = get_ws("Series_Exercicios")
        ws_arquivo = get_ws("Arquivo_Series")
        todas      = ws_ativas.get_all_values()
        
        if not todas or len(todas) < 2: return

        cabecalho = todas[0]
        linhas    = todas[1:]
        corte     = (datetime.now() - timedelta(days=ARCHIVE_DAYS)).strftime("%Y-%m-%d")

        antigas, recentes = [], []
        for row in linhas:
            try:
                id_treino = row[1] if len(row) > 1 else ""
                partes    = id_treino.split("_")
                data_str  = partes[2] if len(partes) >= 3 else "9999-12-31"
                if data_str < corte: antigas.append(row)
                else: recentes.append(row)
            except: recentes.append(row)

        if not antigas: return

        com_retry(lambda: ws_arquivo.append_rows(antigas, value_input_option="RAW"))
        com_retry(lambda: ws_ativas.clear())
        com_retry(lambda: ws_ativas.update("A1", [cabecalho] + recentes))

        _series_cache.clear()
        _series_cache_ts.clear()
        logger.info(f"Arquivamento concluído: {len(antigas)} séries movidas.")
    except Exception as e:
        logger.error(f"Erro no arquivamento: {e}")


# ── MODELOS ───────────────────────────────────────────────────────────────────
class SerieTreino(BaseModel):
    id_serie: str
    id_treino: str
    nome_exercicio: str
    numero_serie: int
    repeticoes: int
    carga_kg: float

class RegistroDieta(BaseModel):
    id_registro: str
    id_usuario: str
    data: str
    tipo_refeicao: str
    calorias: int
    proteinas_g: float
    carbos_g: float
    gorduras_g: float
    check_agua: str
    check_whey: str
    check_creatina: str

class LoginRequest(BaseModel):
    email: str
    senha: str

class RegistroUsuarioRequest(BaseModel):
    nome: str
    email: str
    senha: str
    peso_atual: str
    objetivo: str

class SplitItem(BaseModel):
    id: str
    id_usuario: str
    nome: str
    ultimo_treino: Optional[str] = None

class SalvarSplitsRequest(BaseModel):
    id_usuario: str
    splits: List[SplitItem]

class AtualizarNomeSerie(BaseModel):
    ids: List[str]
    nome_exercicio: str


# ── ROTAS ─────────────────────────────────────────────────────────────────────

@app.post("/login")
def fazer_login(login: LoginRequest):
    try:
        usuarios = get_records("Usuarios")
        for user in usuarios:
            if str(user.get("Email", "")) == login.email:
                if str(user.get("Senha_Hash", "")) == login.senha:
                    return {
                        "status": "sucesso",
                        "usuario": {
                            "id":    str(user.get("ID_Usuario", "")),
                            "nome":  str(user.get("Nome", "")),
                            "email": str(user.get("Email", "")),
                        },
                    }
                raise HTTPException(status_code=401, detail="Senha incorreta")
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/registro")
def registrar_usuario(novo_user: RegistroUsuarioRequest):
    try:
        usuarios = get_records("Usuarios")
        for user in usuarios:
            if str(user.get("Email", "")) == novo_user.email:
                raise HTTPException(status_code=400, detail="E-mail já cadastrado")

        novo_id = f"U{len(usuarios) + 1:03d}"
        com_retry(lambda: get_ws("Usuarios").append_row([
            novo_id, novo_user.nome, novo_user.email, novo_user.senha,
            date.today().isoformat(), novo_user.peso_atual, novo_user.objetivo,
        ]))
        cache_del("Usuarios")
        return {"status": "sucesso", "mensagem": "Conta criada!"}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


@app.get("/splits")
def buscar_splits(id_usuario: str = Query(...)):
    try:
        ws = get_ws("Treinos")
        todas = com_retry(lambda: ws.get_all_values())
        id_busca = id_usuario.strip()

        for row in todas:
            if not row or not row[0].strip() or row[0].strip().upper() == "ID_USUARIO": continue
            if row[0].strip() == id_busca:
                raw = row[1] if len(row) > 1 else "[]"
                return {"splits": json.loads(raw) if raw else [], "encontrado": True}

        return {"splits": [], "encontrado": False}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/splits/salvar")
def salvar_splits(req: SalvarSplitsRequest):
    try:
        ws = get_ws("Treinos")
        dados = com_retry(lambda: ws.get_all_values())
        splits_json = json.dumps([s.dict() for s in req.splits], ensure_ascii=False)
        id_usuario = req.id_usuario.strip()

        for i, row in enumerate(dados, start=1):
            if not row or not row[0].strip() or row[0].strip().upper() == "ID_USUARIO": continue
            if row[0].strip() == id_usuario:
                com_retry(lambda: ws.update_cell(i, 2, splits_json))
                cache_del("Treinos")
                return {"status": "sucesso"}

        com_retry(lambda: ws.append_row([id_usuario, splits_json]))
        cache_del("Treinos")
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


# --- A MÁGICA DA FILA NAS SÉRIES ---

@app.post("/treino/serie")
def registrar_serie(serie: SerieTreino):
    try:
        # Coloca na fila em memória instantaneamente
        nova_linha = [serie.id_serie, serie.id_treino, serie.nome_exercicio, serie.numero_serie, serie.repeticoes, serie.carga_kg]
        agendar_escrita("insert", nova_linha)

        # Atualiza a cache para que o utilizador já veja a série
        serie_dict = {"ID_Serie": serie.id_serie, "ID_Treino": serie.id_treino, "Nome_Exercicio": serie.nome_exercicio, "Numero_da_Serie": serie.numero_serie, "Repeticoes": serie.repeticoes, "Carga_kg": serie.carga_kg}
        series_cache_append(serie.id_treino, serie_dict)

        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.delete("/treino/serie")
def deletar_serie(id: str = Query(...)):
    try:
        # Tira da cache e agenda a exclusão em background
        series_cache_remove(id)
        agendar_escrita("delete", id)
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/treino/serie/nome")
def atualizar_nome_serie(req: AtualizarNomeSerie):
    try:
        # 1. Atualizar imediatamente no cache de leitura
        for chave, lista_series in _series_cache.items():
            for s in lista_series:
                if s.get("ID_Serie") in req.ids:
                    s["Nome_Exercicio"] = req.nome_exercicio

        # 2. Atualizar na Fila caso a série ainda não tenha sido enviada pro Google
        with _fila_lock:
            for item in _fila_escrita:
                if item["acao"] == "insert" and item["dados"][0] in req.ids:
                    item["dados"][2] = req.nome_exercicio # Atualiza o nome na fila

        # 3. Agendar para atualizar as que já estão definitivamente no Google Sheets
        agendar_escrita("rename", {"ids": req.ids, "novo_nome": req.nome_exercicio})

        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


@app.get("/treino/historico")
def buscar_historico(id_usuario: str = Query(...), nome_treino: str = Query(...)):
    try:
        prefixo = f"{nome_treino}_{id_usuario}_"
        hoje = datetime.now().strftime("%Y-%m-%d")
        chave_hoje = f"{prefixo}{hoje}"

        # 1. Lê do Cache
        cached = series_cache_get(chave_hoje)
        if cached is not None:
            return {"series": cached, "data_ultimo": hoje, "fonte": "cache"}

        # 2. Arquiva lixo antigo sem bloquear a UI
        try: arquivar_series_antigas()
        except: pass

        # 3. Leitura Cirúrgica no Sheets (Muito mais rápida que get_all_records)
        ws = get_ws("Series_Exercicios")
        matches = com_retry(lambda: ws.findall(prefixo, in_column=2))
        
        if not matches: return {"series": [], "data_ultimo": None}

        numeros_linhas = [m.row for m in matches]
        valores_celulas = com_retry(lambda: ws.batch_get([f"B{r}" for r in numeros_linhas]))

        datas = set()
        for val in valores_celulas:
            if val and val[0] and len(val[0][0].split("_")) >= 3:
                datas.add(val[0][0].split("_")[2])

        if not datas: return {"series": [], "data_ultimo": None}

        ultima_data = max(datas)
        linhas_ultimo = [m.row for m, v in zip(matches, valores_celulas) if v and v[0] and ultima_data in v[0][0]]
        
        if not linhas_ultimo: return {"series": [], "data_ultimo": ultima_data}

        ranges = [f"A{r}:F{r}" for r in linhas_ultimo]
        dados_batch = com_retry(lambda: ws.batch_get(ranges))

        series = []
        for dado in dados_batch:
            if not dado or not dado[0] or len(dado[0]) < 6: continue
            row = dado[0]
            series.append({
                "id_serie": str(row[0]), "id_treino": str(row[1]), "nome_exercicio": str(row[2]),
                "numero_serie": int(row[3]) if str(row[3]).isdigit() else 0,
                "repeticoes": int(row[4]) if str(row[4]).isdigit() else 0,
                "carga_kg": float(row[5]) if row[5] else 0.0,
            })

        series_cache_set(f"{prefixo}{ultima_data}", series)
        return {"series": series, "data_ultimo": ultima_data, "fonte": "sheets"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "tamanho_da_fila": len(_fila_escrita),
        "chaves_series_cache": len(_series_cache)
    }