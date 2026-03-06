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
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FitApp API")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in ALLOWED_ORIGINS.split(",")] if ALLOWED_ORIGINS != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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


# ── RETRY COM EXPONENTIAL BACKOFF ─────────────────────────────────────────────
def com_retry(fn, tentativas=4, espera_inicial=1.0):
    espera = espera_inicial
    for i in range(tentativas):
        try:
            return fn()
        except APIError as e:
            codigo = e.response.status_code if hasattr(e, 'response') else 0
            if codigo == 429:
                logger.warning(f"Rate limit. Tentativa {i+1}/{tentativas}. Aguardando {espera}s...")
                time.sleep(espera)
                espera *= 2
            else:
                raise
        except Exception:
            raise
    raise HTTPException(status_code=429, detail=f"Limite Google atingido. Tente novamente.")


# ── CACHE ─────────────────────────────────────────────────────────────────────
_mem_cache: dict = {}
CACHE_TTL = {
    "Usuarios": 300,
    "Treinos":  120,
}

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


# ── CACHE LOCAL DE SÉRIES (write-through) ─────────────────────────────────────
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

def series_cache_remove(chave: str, id_serie: str):
    if chave in _series_cache:
        _series_cache[chave] = [
            s for s in _series_cache[chave] if s.get("ID_Serie") != id_serie
        ]


# ── ARQUIVAMENTO AUTOMÁTICO ───────────────────────────────────────────────────
ARCHIVE_DAYS = 90
_ultimo_arquivamento: float = 0
ARCHIVE_INTERVAL = 3600 * 6

def extrair_data_de_id_treino(id_treino: str) -> str:
    """
    Extrai a data YYYY-MM-DD de um ID_Treino, independente do formato.

    Formatos existentes na planilha:
      "NomeSplit_IDUsuario_2026-03-04"                  (sem timestamp)
      "NomeSplit_IDUsuario_2026-03-04_1772656127866"    (com timestamp)

    O nome do split pode conter espaços e underscores (ex: "Upper ", "Pernas "),
    por isso NÃO usamos índice fixo — procuramos pelo padrão YYYY-MM-DD.
    """
    for parte in id_treino.split("_"):
        if len(parte) == 10 and parte[4] == '-' and parte[7] == '-':
            return parte
    return ""

def arquivar_series_antigas():
    global _ultimo_arquivamento
    if time.time() - _ultimo_arquivamento < ARCHIVE_INTERVAL:
        return
    _ultimo_arquivamento = time.time()
    logger.info("Iniciando arquivamento...")
    try:
        ws_ativas  = get_ws("Series_Exercicios")
        ws_arquivo = get_ws("Arquivo_Series")
        todas      = ws_ativas.get_all_values()
        if not todas or len(todas) < 2:
            return
        cabecalho = todas[0]
        linhas    = todas[1:]
        corte     = (datetime.now() - timedelta(days=ARCHIVE_DAYS)).strftime("%Y-%m-%d")
        antigas, recentes = [], []
        for row in linhas:
            try:
                id_treino = row[1] if len(row) > 1 else ""
                data_str  = extrair_data_de_id_treino(id_treino) or "9999-12-31"
                (antigas if data_str < corte else recentes).append(row)
            except Exception:
                recentes.append(row)
        if not antigas:
            logger.info("Nada para arquivar.")
            return
        com_retry(lambda: ws_arquivo.append_rows(antigas, value_input_option="RAW"))
        com_retry(lambda: ws_ativas.clear())
        com_retry(lambda: ws_ativas.update("A1", [cabecalho] + recentes))
        _series_cache.clear()
        _series_cache_ts.clear()
        logger.info(f"Arquivadas: {len(antigas)}, mantidas: {len(recentes)}")
    except Exception as e:
        logger.error(f"Arquivamento falhou (não crítico): {e}")


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
    altura: str
    idade: str
    genero: str

class SplitItem(BaseModel):
    id: str
    id_usuario: str
    nome: str
    nomeHistorico: Optional[str] = None
    ultimo_treino: Optional[str] = None

class SalvarSplitsRequest(BaseModel):
    id_usuario: str
    splits: List[SplitItem]

class AtualizarNomeSerie(BaseModel):
    ids: List[str]
    nome_exercicio: str

class RegistroCardio(BaseModel):
    id_registro: str
    id_usuario:  str
    data:        str
    atividade:   str
    label:       str
    intensidade: str
    minutos:     int
    peso_kg:     float
    kcal:        int
    met:         float


# ── AUTH ──────────────────────────────────────────────────────────────────────
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/registro")
def registrar_usuario(novo_user: RegistroUsuarioRequest):
    try:
        usuarios = get_records("Usuarios")
        for user in usuarios:
            if str(user.get("Email", "")) == novo_user.email:
                raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        novo_id = f"U{len(usuarios) + 1:03d}"
        
        # Agora salvamos as 3 informações novas na planilha
        com_retry(lambda: get_ws("Usuarios").append_row([
            novo_id, novo_user.nome, novo_user.email, novo_user.senha,
            date.today().isoformat(), novo_user.peso_atual, novo_user.objetivo,
            novo_user.altura, novo_user.idade, novo_user.genero
        ]))
        cache_del("Usuarios")
        return {"status": "sucesso", "mensagem": "Conta criada!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── SPLITS ────────────────────────────────────────────────────────────────────
@app.get("/splits")
def buscar_splits(id_usuario: str = Query(...)):
    try:
        ws       = get_ws("Treinos")
        todas    = com_retry(lambda: ws.get_all_values())
        id_busca = id_usuario.strip()
        for row in todas:
            if not row or not row[0].strip():
                continue
            if row[0].strip().upper() == "ID_USUARIO":
                continue
            if row[0].strip() == id_busca:
                raw    = row[1] if len(row) > 1 else "[]"
                splits = json.loads(raw) if raw else []
                return {"splits": splits, "encontrado": True}
        return {"splits": [], "encontrado": False}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON inválido: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/splits/salvar")
def salvar_splits(req: SalvarSplitsRequest):
    try:
        ws          = get_ws("Treinos")
        dados       = com_retry(lambda: ws.get_all_values())
        splits_json = json.dumps([s.dict() for s in req.splits], ensure_ascii=False)
        id_usuario  = req.id_usuario.strip()
        for i, row in enumerate(dados, start=1):
            if not row or not row[0].strip():
                continue
            if row[0].strip().upper() == "ID_USUARIO":
                continue
            if row[0].strip() == id_usuario:
                com_retry(lambda: ws.update_cell(i, 2, splits_json))
                cache_del("Treinos")
                return {"status": "sucesso", "mensagem": "Splits atualizados."}
        com_retry(lambda: ws.append_row([id_usuario, splits_json]))
        cache_del("Treinos")
        return {"status": "sucesso", "mensagem": "Splits salvos."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── TREINOS / SÉRIES ──────────────────────────────────────────────────────────
@app.post("/treino/serie")
def registrar_serie(serie: SerieTreino):
    try:
        com_retry(lambda: get_ws("Series_Exercicios").append_row([
            serie.id_serie, serie.id_treino, serie.nome_exercicio,
            serie.numero_serie, serie.repeticoes, serie.carga_kg,
        ]))
        # Write-through: adiciona ao cache sem invalidar
        series_cache_append(serie.id_treino, {
            "ID_Serie":        serie.id_serie,
            "ID_Treino":       serie.id_treino,
            "Nome_Exercicio":  serie.nome_exercicio,
            "Numero_da_Serie": serie.numero_serie,
            "Repeticoes":      serie.repeticoes,
            "Carga_kg":        serie.carga_kg,
        })
        return {"status": "sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/treino/serie")
def deletar_serie(id: str = Query(...)):
    try:
        ws  = get_ws("Series_Exercicios")
        cel = com_retry(lambda: ws.find(id, in_column=1))
        if not cel:
            raise HTTPException(status_code=404, detail="Série não encontrada")
        linha     = com_retry(lambda: ws.row_values(cel.row))
        id_treino = linha[1] if len(linha) > 1 else None
        com_retry(lambda: ws.delete_rows(cel.row))
        if id_treino:
            series_cache_remove(id_treino, id)
        return {"status": "sucesso"}
    except HTTPException:
        raise
    except gspread.exceptions.CellNotFound:
        raise HTTPException(status_code=404, detail="Série não encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/treino/serie/nome")
def atualizar_nome_serie(req: AtualizarNomeSerie):
    try:
        ws    = get_ws("Series_Exercicios")
        todas = com_retry(lambda: ws.get_all_values())
        updates = []
        for i, row in enumerate(todas, start=1):
            if row and row[0] in req.ids:
                updates.append({"range": f"C{i}", "values": [[req.nome_exercicio]]})
        if updates:
            com_retry(lambda: ws.batch_update(updates))
        return {"status": "sucesso", "atualizadas": len(updates)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/treino/historico")
def buscar_historico(
    id_usuario:  str = Query(...),
    nome_treino: str = Query(...),
    split_id:    Optional[str] = Query(None),
):
    """
    Busca as séries do ÚLTIMO treino do usuário naquele split.

    Aceita dois identificadores para compatibilidade retroativa:
      - split_id:    prefixo novo (split.id_usuario), imutável ao renomear o grupo.
      - nome_treino: prefixo antigo (nome do split), usado por registros já gravados.

    Busca pelos dois prefixos e retorna o treino mais recente da união.
    Isso garante que renomear um grupo muscular NÃO apaga o histórico.
    """
    try:
        # Arquivamento lazy — não bloqueia
        try:
            arquivar_series_antigas()
        except Exception:
            pass

        # Leitura completa da aba
        todas = com_retry(lambda: get_ws("Series_Exercicios").get_all_records())

        # Monta lista de prefixos para busca
        prefixos = []
        if split_id:
            prefixos.append(f"{split_id}_{id_usuario}_")
        # Sempre inclui o prefixo por nome (fallback para registros antigos)
        if nome_treino:
            prefixos.append(f"{nome_treino}_{id_usuario}_")

        # Filtra registros que batem com qualquer prefixo
        registros = [
            r for r in todas
            if any(str(r.get("ID_Treino", "")).startswith(p) for p in prefixos)
        ]

        if not registros:
            return {"series": [], "data_ultimo": None}

        # Agrupa por ID_Treino completo
        mapa_treinos: dict = {}
        for r in registros:
            id_treino = str(r.get("ID_Treino", ""))
            mapa_treinos.setdefault(id_treino, []).append(r)

        # Ordena por (data, timestamp) para pegar o mais recente
        def chave_ordenacao(id_treino: str):
            data = extrair_data_de_id_treino(id_treino)
            partes = id_treino.split("_")
            timestamp = next(
                (p for p in reversed(partes) if p.isdigit() and len(p) >= 10),
                "0"
            )
            return (data, timestamp)

        id_ultimo   = max(mapa_treinos.keys(), key=chave_ordenacao)
        data_ultimo = extrair_data_de_id_treino(id_ultimo)

        # Checa cache da sessão
        cached = series_cache_get(id_ultimo)
        if cached is not None:
            return {"series": cached, "data_ultimo": data_ultimo, "fonte": "cache"}

        # Formata resposta
        series = []
        for r in mapa_treinos[id_ultimo]:
            try:
                series.append({
                    "id_serie":       str(r.get("ID_Serie", "")),
                    "id_treino":      str(r.get("ID_Treino", "")),
                    "nome_exercicio": str(r.get("Nome_Exercicio", "")),
                    "numero_serie":   int(r.get("Numero_da_Serie", 0)),
                    "repeticoes":     int(r.get("Repeticoes", 0)),
                    "carga_kg":       float(r.get("Carga_kg", 0)),
                })
            except (ValueError, TypeError):
                continue

        series_cache_set(id_ultimo, series)
        return {"series": series, "data_ultimo": data_ultimo, "fonte": "sheets"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DIETA ─────────────────────────────────────────────────────────────────────
@app.post("/dieta/registro")
def registrar_dieta(registro: RegistroDieta):
    try:
        com_retry(lambda: get_ws("Dieta_Suplementacao").append_row([
            registro.id_registro, registro.id_usuario, registro.data,
            registro.tipo_refeicao, registro.calorias, registro.proteinas_g,
            registro.carbos_g, registro.gorduras_g, registro.check_agua,
            registro.check_whey, registro.check_creatina,
        ]))
        return {"status": "sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── CARDIO ────────────────────────────────────────────────────────────────────
@app.post("/cardio")
def registrar_cardio(registro: RegistroCardio):
    logger.info(f"[cardio] POST recebido: {registro.dict()}")
    try:
        _ws_cache.pop("Cardio", None)  # força re-lookup da aba
        ws = get_ws("Cardio")
        linha = [
            registro.id_registro, registro.id_usuario, registro.data,
            registro.atividade,   registro.label,       registro.intensidade,
            registro.minutos,     registro.peso_kg,     registro.kcal,
            registro.met,
        ]
        logger.info(f"[cardio] Gravando: {linha}")
        com_retry(lambda: ws.append_row(linha))
        logger.info(f"[cardio] Gravado com sucesso")
        return {"status": "sucesso"}
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"[cardio] ERRO:\n{tb}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")


@app.get("/cardio")
def buscar_cardio(
    id_usuario: str = Query(...),
    limite:     int = Query(5),
):
    """Retorna os últimos N registros de cardio do usuário, do mais recente ao mais antigo."""
    try:
        ws     = get_ws("Cardio")
        todas  = com_retry(lambda: ws.get_all_records())
        # Filtra pelo usuário e ordena por data desc (data é YYYY-MM-DD, ordem lexicográfica funciona)
        meus = [
            r for r in todas
            if str(r.get("ID_Usuario", "")) == id_usuario.strip()
        ]
        meus.sort(key=lambda r: (str(r.get("Data", "")), str(r.get("ID_Registro", ""))), reverse=True)
        registros = []
        for r in meus[:limite]:
            try:
                registros.append({
                    "id_registro": str(r.get("ID_Registro", "")),
                    "data":        str(r.get("Data", "")),
                    "atividade":   str(r.get("Atividade", "")),
                    "label":       str(r.get("Label", "")),
                    "intensidade": str(r.get("Intensidade", "")),
                    "minutos":     int(r.get("Minutos", 0)),
                    "peso_kg":     float(r.get("Peso_kg", 0)),
                    "kcal":        int(r.get("Kcal", 0)),
                })
            except (ValueError, TypeError):
                continue
        return {"registros": registros}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── HEALTH ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":              "ok",
        "cache_usuarios":      "Usuarios" in _mem_cache,
        "cache_treinos":       "Treinos"  in _mem_cache,
        "chaves_series_cache": len(_series_cache),
        "series_em_cache":     sum(len(v) for v in _series_cache.values()),
        "ultimo_arquivamento": (
            datetime.fromtimestamp(_ultimo_arquivamento).isoformat()
            if _ultimo_arquivamento else None
        ),
    }