from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import gspread
from google.oauth2.service_account import Credentials
from datetime import date, datetime
import json
import time

app = FastAPI(title="FitApp API")

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_credentials=True + allow_origins=["*"] é inválido pela spec CORS.
# Em desenvolvimento use o origin exato; em produção coloque o domínio real.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev
        "http://127.0.0.1:5173",
        "http://localhost:4173",   # Vite preview
        # "https://seudominio.com", # produção
    ],
    allow_credentials=False,       # False é suficiente — não usamos cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── GOOGLE SHEETS — conexão única, reutilizada em todas as requests ───────────
scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]
credentials = Credentials.from_service_account_file("credentials.json", scopes=scopes)
gc = gspread.authorize(credentials)
planilha = gc.open("App Treinos")

# Worksheets cacheados — evita abrir conexão nova a cada request
_ws_cache: dict = {}

def get_ws(nome: str):
    """Retorna o worksheet pelo nome, reutilizando o objeto em memória."""
    if nome not in _ws_cache:
        _ws_cache[nome] = planilha.worksheet(nome)
    return _ws_cache[nome]


# ── CACHE SIMPLES EM MEMÓRIA ──────────────────────────────────────────────────
# Dados que raramente mudam (Usuarios, Splits) ficam em cache por TTL segundos.
# Dados de treino (Series_Exercicios) têm TTL menor por mudarem com frequência.
_mem_cache: dict = {}
CACHE_TTL = {
    "Usuarios":        300,   # 5 min — usuários raramente mudam
    "Treinos":         120,   # 2 min — splits mudam só quando o usuário configura
    "Series_Exercicios": 30,  # 30 s  — muda durante o treino
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
    """Lê registros com cache — evita bater no Sheets em toda request."""
    cached = cache_get(nome_aba)
    if cached is not None:
        return cached
    data = get_ws(nome_aba).get_all_records()
    cache_set(nome_aba, data)
    return data


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


# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.post("/login")
def fazer_login(login: LoginRequest):
    try:
        # Lê do cache — não bate no Sheets se já foi lido recentemente
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
        get_ws("Usuarios").append_row([
            novo_id, novo_user.nome, novo_user.email, novo_user.senha,
            date.today().isoformat(), novo_user.peso_atual, novo_user.objetivo,
        ])
        # Invalida o cache para o próximo login já enxergar o novo usuário
        cache_del("Usuarios")
        return {"status": "sucesso", "mensagem": "Conta criada!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── SPLITS ────────────────────────────────────────────────────────────────────
@app.get("/splits/{id_usuario}")
def buscar_splits(id_usuario: str):
    try:
        ws = get_ws("Treinos")
        # Usa get_all_values() para leitura direta por índice — evita depender do cabeçalho.
        # A planilha pode ou não ter cabeçalho; tratamos as duas situações.
        todas = ws.get_all_values()
        id_busca = id_usuario.strip()

        for row in todas:
            if not row or not row[0].strip():
                continue
            cell_id = row[0].strip()
            # Pula linha de cabeçalho caso exista
            if cell_id.upper() == "ID_USUARIO":
                continue
            if cell_id == id_busca:
                raw = row[1] if len(row) > 1 else "[]"
                splits = json.loads(raw) if raw else []
                return {"splits": splits, "encontrado": True}

        return {"splits": [], "encontrado": False}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON inválido nos splits: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/splits/salvar")
def salvar_splits(req: SalvarSplitsRequest):
    try:
        ws          = get_ws("Treinos")
        dados       = ws.get_all_values()
        splits_json = json.dumps([s.dict() for s in req.splits], ensure_ascii=False)
        id_usuario  = req.id_usuario.strip()

        for i, row in enumerate(dados, start=1):
            if not row or not row[0].strip():
                continue
            # Pula linha de cabeçalho caso exista
            if row[0].strip().upper() == "ID_USUARIO":
                continue
            if row[0].strip() == id_usuario:
                ws.update_cell(i, 2, splits_json)
                cache_del("Treinos")
                return {"status": "sucesso", "mensagem": "Splits atualizados."}

        # Nenhuma linha encontrada — cria nova
        ws.append_row([id_usuario, splits_json])
        cache_del("Treinos")
        return {"status": "sucesso", "mensagem": "Splits salvos."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── TREINOS / SÉRIES ──────────────────────────────────────────────────────────
@app.post("/treino/serie")
def registrar_serie(serie: SerieTreino):
    try:
        get_ws("Series_Exercicios").append_row([
            serie.id_serie, serie.id_treino, serie.nome_exercicio,
            serie.numero_serie, serie.repeticoes, serie.carga_kg,
        ])
        cache_del("Series_Exercicios")  # próxima leitura de histórico busca dados frescos
        return {"status": "sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/treino/serie/{id_serie}")
def deletar_serie(id_serie: str):
    try:
        ws  = get_ws("Series_Exercicios")
        cel = ws.find(id_serie)
        ws.delete_rows(cel.row)
        cache_del("Series_Exercicios")
        return {"status": "sucesso"}
    except gspread.exceptions.CellNotFound:
        raise HTTPException(status_code=404, detail="Série não encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/treino/historico")
def buscar_historico(
    id_usuario: str = Query(...),
    nome_treino: str = Query(...),
):
    """
    Retorna as séries do ÚLTIMO treino do usuário naquele grupamento.
    Usa o cache de Series_Exercicios — só bate no Sheets se o cache expirou
    ou se uma série foi inserida/deletada recentemente.
    """
    try:
        todas    = get_records("Series_Exercicios")
        prefixo  = f"{nome_treino}_{id_usuario}_"
        registros = [r for r in todas if str(r.get("ID_Treino", "")).startswith(prefixo)]

        if not registros:
            return {"series": [], "data_ultimo": None}

        datas  = {str(r.get("ID_Treino", "")).split("_")[-1] for r in registros}
        ultima = max(datas)
        chave  = f"{prefixo}{ultima}"

        series = [
            {
                "id_serie":       str(r.get("ID_Serie", "")),
                "id_treino":      str(r.get("ID_Treino", "")),
                "nome_exercicio": str(r.get("Nome_Exercicio", "")),
                "numero_serie":   int(r.get("Numero_da_Serie", 0)),
                "repeticoes":     int(r.get("Repeticoes", 0)),
                "carga_kg":       float(r.get("Carga_kg", 0)),
            }
            for r in registros if str(r.get("ID_Treino", "")) == chave
        ]
        return {"series": series, "data_ultimo": ultima}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DIETA ─────────────────────────────────────────────────────────────────────
@app.post("/dieta/registro")
def registrar_dieta(registro: RegistroDieta):
    try:
        get_ws("Dieta_Suplementacao").append_row([
            registro.id_registro, registro.id_usuario, registro.data,
            registro.tipo_refeicao, registro.calorias, registro.proteinas_g,
            registro.carbos_g, registro.gorduras_g, registro.check_agua,
            registro.check_whey, registro.check_creatina,
        ])
        return {"status": "sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))