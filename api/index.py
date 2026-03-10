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
import string
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FitApp API Unificada")

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

# Tenta ler a Variável de Ambiente do Vercel primeiro.
# Se não existir (por ex, no seu PC), usa o ficheiro credentials.json.
raw_creds = os.environ.get("GOOGLE_CREDENTIALS")
if raw_creds:
    creds_dict = json.loads(raw_creds)
    credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
else:
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
        except Exception:
            raise
    raise HTTPException(status_code=429, detail="Limite Google atingido.")

# ── CACHE & UTILS ─────────────────────────────────────────────────────────────
_mem_cache: dict = {}
_series_cache: dict = {}
_series_cache_ts: dict = {}

def cache_get(key: str):
    entry = _mem_cache.get(key)
    if entry and (time.time() - entry["ts"]) < 120: return entry["data"]
    return None

def cache_set(key: str, data): _mem_cache[key] = {"data": data, "ts": time.time()}
def cache_del(key: str): _mem_cache.pop(key, None)

def get_records(nome_aba: str) -> list:
    cached = cache_get(nome_aba)
    if cached is not None: return cached
    data = com_retry(lambda: get_ws(nome_aba).get_all_records())
    cache_set(nome_aba, data)
    return data

def extrair_data_de_id_treino(id_treino: str) -> str:
    for parte in id_treino.split("_"):
        if len(parte) == 10 and parte[4] == '-' and parte[7] == '-': return parte
    return ""

# ── MODELOS ───────────────────────────────────────────────────────────────────
class LoginReq(BaseModel): email: str; senha: str
class RegReq(BaseModel): nome: str; email: str; senha: str; peso_atual: str; objetivo: str; altura: str; idade: str; genero: str; atividade: Optional[str] = ""
class EditarUsuarioReq(BaseModel): id_usuario: str; nome: str; email: str; senha: str; peso_atual: str; objetivo: str; altura: str; idade: str; genero: str; atividade: Optional[str] = ""
class ResetReq(BaseModel): email: str; senha_nova: str
class SplitItem(BaseModel): id: str; id_usuario: str; nome: str; nomeHistorico: Optional[str] = None; ultimo_treino: Optional[str] = None
class SalvarSplitsReq(BaseModel): id_usuario: str; splits: List[SplitItem]
class SerieTreino(BaseModel): id_serie: str; id_treino: str; nome_exercicio: str; numero_serie: int; repeticoes: int; carga_kg: float
class AtualizarNomeSerie(BaseModel): ids: List[str]; nome_exercicio: str
class RegistroDieta(BaseModel): id_registro: str; id_usuario: str; data: str; tipo_refeicao: str; calorias: int; proteinas_g: float; carbos_g: float; gorduras_g: float; check_agua: str; check_whey: str; check_creatina: str
class RegistroCardio(BaseModel): id_registro: str; id_usuario: str; data: str; atividade: str; label: str; intensidade: str; minutos: int; peso_kg: float; kcal: int; met: float
class RankCriar(BaseModel): id_usuario: str; nome_usuario: str; nome: str; data_fim: str
class RankEntrar(BaseModel): id_usuario: str; nome_usuario: str; codigo: str

# ── AUTH & USUARIOS ───────────────────────────────────────────────────────────
@app.post("/api/login")
def fazer_login(login: LoginReq):
    try:
        for user in get_records("Usuarios"):
            if str(user.get("Email", "")) == login.email or str(user.get("Nome", "")) == login.email:
                if str(user.get("Senha_Hash", "")) == login.senha or str(user.get("Senha", "")) == login.senha:
                    return {
                        "status": "sucesso", 
                        "token": "sessao_ativa", 
                        "usuario": {
                            "id": str(user.get("ID_Usuario", "")), 
                            "nome": str(user.get("Nome", "")), 
                            "email": str(user.get("Email", "")),
                            "peso_atual": str(user.get("Peso_Atual", "")),
                            "objetivo": str(user.get("Objetivo", "")),
                            "altura": str(user.get("Altura", "")),
                            "idade": str(user.get("Idade", "")),
                            "genero": str(user.get("Genero", "")),
                            "atividade": str(user.get("Atividade", ""))
                        }
                    }
                raise HTTPException(401, "Senha incorreta")
        raise HTTPException(404, "Usuário não encontrado")
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/api/registro")
def registrar_usuario(req: RegReq):
    try:
        usuarios = get_records("Usuarios")
        for user in usuarios:
            if str(user.get("Email", "")) == req.email: raise HTTPException(400, "E-mail já cadastrado")
        novo_id = f"U{len(usuarios) + 1:03d}"
        com_retry(lambda: get_ws("Usuarios").append_row([novo_id, req.nome, req.email, req.senha, date.today().isoformat(), req.peso_atual, req.objetivo, req.altura, req.idade, req.genero, req.atividade or ""]))
        cache_del("Usuarios")
        return {"status": "sucesso"}
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/api/usuario/editar")
def editar_usuario(req: EditarUsuarioReq):
    try:
        usuarios = get_records("Usuarios")
        ws = get_ws("Usuarios")
        for i, user in enumerate(usuarios, start=2): # Linha 1 é o cabeçalho
            if str(user.get("ID_Usuario", "")) == req.id_usuario:
                updates = [
                    {"range": f"B{i}", "values": [[req.nome]]},
                    {"range": f"C{i}", "values": [[req.email]]},
                    {"range": f"F{i}", "values": [[req.peso_atual]]},
                    {"range": f"G{i}", "values": [[req.objetivo]]},
                    {"range": f"H{i}", "values": [[req.altura]]},
                    {"range": f"I{i}", "values": [[req.idade]]},
                    {"range": f"J{i}", "values": [[req.genero]]},
                    {"range": f"K{i}", "values": [[req.atividade or ""]]},
                ]
                # Só atualiza a senha se o utilizador digitou algo novo
                if req.senha.strip() != "":
                    updates.append({"range": f"D{i}", "values": [[req.senha]]})
                
                com_retry(lambda: ws.batch_update(updates))
                cache_del("Usuarios")
                return {"status": "sucesso"}
        raise HTTPException(404, "Usuário não encontrado")
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/api/reset-senha")
@app.post("/api/reset_senha")
def reset_senha(req: ResetReq):
    try:
        usuarios = get_records("Usuarios")
        ws = get_ws("Usuarios")
        for i, user in enumerate(usuarios, start=2):
            if str(user.get("Email", "")) == req.email:
                com_retry(lambda: ws.update_cell(i, 4, req.senha_nova))
                cache_del("Usuarios")
                return {"status": "sucesso"}
        raise HTTPException(404, "E-mail não encontrado")
    except Exception as e: raise HTTPException(500, str(e))

# ── SPLITS ────────────────────────────────────────────────────────────────────
@app.get("/api/splits")
def buscar_splits(id_usuario: str = Query(...)):
    try:
        for row in com_retry(lambda: get_ws("Treinos").get_all_values()):
            if row and len(row) > 0 and row[0].strip() == id_usuario.strip():
                return {"splits": json.loads(row[1]) if len(row)>1 and row[1] else [], "encontrado": True}
        return {"splits": [], "encontrado": False}
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/api/splits")
@app.post("/api/splits/salvar")
def salvar_splits(req: SalvarSplitsReq):
    try:
        ws, dados = get_ws("Treinos"), com_retry(lambda: get_ws("Treinos").get_all_values())
        splits_json, id_u = json.dumps([s.dict() for s in req.splits], ensure_ascii=False), req.id_usuario.strip()
        for i, row in enumerate(dados, start=1):
            if row and len(row)>0 and row[0].strip() == id_u:
                com_retry(lambda: ws.update_cell(i, 2, splits_json))
                cache_del("Treinos")
                return {"status": "sucesso"}
        com_retry(lambda: ws.append_row([id_u, splits_json]))
        cache_del("Treinos")
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(500, str(e))

# ── SÉRIES & HISTÓRICO ────────────────────────────────────────────────────────
@app.post("/api/treino/serie")
def registrar_serie(s: SerieTreino):
    try:
        com_retry(lambda: get_ws("Series_Exercicios").append_row([s.id_serie, s.id_treino, s.nome_exercicio, s.numero_serie, s.repeticoes, s.carga_kg]))
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(500, str(e))

@app.delete("/api/treino/serie")
def deletar_serie(id: str = Query(...)):
    try:
        ws = get_ws("Series_Exercicios")
        cel = com_retry(lambda: ws.find(id, in_column=1))
        if not cel: return {"status": "ok"}
        com_retry(lambda: ws.delete_rows(cel.row))
        return {"status": "sucesso"}
    except Exception: return {"status": "ok"}

@app.post("/api/treino/serie/nome")
def atualizar_nome_serie(req: AtualizarNomeSerie):
    try:
        ws, todas = get_ws("Series_Exercicios"), com_retry(lambda: get_ws("Series_Exercicios").get_all_values())
        updates = [{"range": f"C{i}", "values": [[req.nome_exercicio]]} for i, r in enumerate(todas, 1) if r and r[0] in req.ids]
        if updates: com_retry(lambda: ws.batch_update(updates))
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/api/treino/historico/todos")
def buscar_historico_todos(id_usuario: str = Query(...)):
    """Retorna TODAS as séries do usuário, enriquecidas com data e nome do split."""
    try:
        todas = com_retry(lambda: get_ws("Series_Exercicios").get_all_records())
        # filtra pelo id_usuario que aparece no ID_Treino (formato: splitId_userId_data_ts)
        minhas = [r for r in todas if f"_{id_usuario}_" in str(r.get("ID_Treino", ""))]

        # Carrega splits para resolver nome do split pelo split_id
        splits_data: dict = {}
        try:
            for row in com_retry(lambda: get_ws("Treinos").get_all_values()):
                if row and len(row) > 1 and row[0].strip() == id_usuario.strip():
                    for s in json.loads(row[1]):
                        splits_data[s.get("id", "")] = s.get("nomeHistorico") or s.get("nome", "")
        except Exception:
            pass

        series = []
        for r in minhas:
            id_treino = str(r.get("ID_Treino", ""))
            data_treino = extrair_data_de_id_treino(id_treino)
            # split_id é a primeira parte do ID_Treino antes do primeiro _userId_
            partes = id_treino.split(f"_{id_usuario}_")
            split_id_raw = partes[0] if partes else ""
            nome_split = splits_data.get(split_id_raw, split_id_raw)
            series.append({
                "id_serie":       str(r.get("ID_Serie", "")),
                "id_treino":      id_treino,
                "nome_exercicio": str(r.get("Nome_Exercicio", "")),
                "numero_serie":   int(r.get("Numero_da_Serie", 0)),
                "repeticoes":     int(r.get("Repeticoes", 0)),
                "carga_kg":       float(r.get("Carga_kg", 0)),
                "data_treino":    data_treino,
                "nome_split":     nome_split,
            })
        series.sort(key=lambda s: (s["data_treino"], s["id_treino"]))
        return {"series": series}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/treino/historico")
def buscar_historico(id_usuario: str = Query(...), nome_treino: str = Query(...), split_id: Optional[str] = Query(None)):
    try:
        todas = com_retry(lambda: get_ws("Series_Exercicios").get_all_records())
        prefixos = [f"{split_id}_{id_usuario}_"] if split_id else []
        prefixos.append(f"{nome_treino}_{id_usuario}_")
        registros = [r for r in todas if any(str(r.get("ID_Treino", "")).startswith(p) for p in prefixos)]
        if not registros: return {"series": []}
        
        mapa_treinos = {}
        for r in registros: mapa_treinos.setdefault(str(r.get("ID_Treino", "")), []).append(r)
        
        def chave_ord(idt):
            pts = idt.split("_")
            ts = next((p for p in reversed(pts) if p.isdigit() and len(p)>=10), "0")
            return (extrair_data_de_id_treino(idt), ts)
            
        id_ultimo = max(mapa_treinos.keys(), key=chave_ord)
        series = [{"id_serie": str(r.get("ID_Serie","")), "nome_exercicio": str(r.get("Nome_Exercicio","")), "numero_serie": int(r.get("Numero_da_Serie",0)), "repeticoes": int(r.get("Repeticoes",0)), "carga_kg": float(r.get("Carga_kg",0))} for r in mapa_treinos[id_ultimo]]
        return {"series": series}
    except Exception as e: raise HTTPException(500, str(e))

# ── DIETA ─────────────────────────────────────────────────────────────────────
@app.post("/api/dieta/registro")
def registrar_dieta(r: RegistroDieta):
    try:
        com_retry(lambda: get_ws("Dieta_Suplementacao").append_row([r.id_registro, r.id_usuario, r.data, r.tipo_refeicao, r.calorias, r.proteinas_g, r.carbos_g, r.gorduras_g, r.check_agua, r.check_whey, r.check_creatina]))
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/api/dieta/registro")
def buscar_dieta(id_usuario: str = Query(...), data: str = Query(...)):
    try:
        meus = [r for r in com_retry(lambda: get_ws("Dieta_Suplementacao").get_all_records()) if str(r.get("ID_Usuario", "")) == id_usuario and str(r.get("Data", "")) == data]
        return {"registros": meus}
    except Exception as e: raise HTTPException(500, str(e))

@app.delete("/api/dieta/registro")
def deletar_dieta(id_registro: str = Query(...)):
    try:
        ws = get_ws("Dieta_Suplementacao")
        cel = com_retry(lambda: ws.find(id_registro, in_column=1))
        if not cel: return {"status": "ok"}
        com_retry(lambda: ws.delete_rows(cel.row))
        return {"status": "sucesso"}
    except Exception: return {"status": "ok"}

# ── CARDIO ────────────────────────────────────────────────────────────────────
@app.post("/api/cardio")
def registrar_cardio(r: RegistroCardio):
    try:
        com_retry(lambda: get_ws("Cardio").append_row([r.id_registro, r.id_usuario, r.data, r.atividade, r.label, r.intensidade, r.minutos, r.peso_kg, r.kcal, r.met]))
        return {"status": "sucesso"}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/api/cardio")
def buscar_cardio(id_usuario: str = Query(...), limite: int = Query(5)):
    try:
        meus = [r for r in com_retry(lambda: get_ws("Cardio").get_all_records()) if str(r.get("ID_Usuario", "")) == id_usuario]
        meus.sort(key=lambda r: (str(r.get("Data", "")), str(r.get("ID_Registro", ""))), reverse=True)
        registros = [{"id_registro": str(r.get("ID_Registro","")), "data": str(r.get("Data","")), "atividade": str(r.get("Atividade","")), "label": str(r.get("Label","")), "intensidade": str(r.get("Intensidade","")), "minutos": int(r.get("Minutos",0)), "kcal": int(r.get("Kcal",0))} for r in meus[:limite]]
        return {"registros": registros}
    except Exception as e: raise HTTPException(500, str(e))

# ── RANKING ───────────────────────────────────────────────────────────────────
@app.get("/api/treino/relatorio")
def relatorio_semanal(id_usuario: str = Query(...)):
    """Relatório das últimas 4 semanas + streak atual de treinos."""
    from datetime import timedelta
    series   = get_records("Series_Exercicios")
    treinos_ws = get_records("Treinos")

    # mapa split_id → nome
    splits_data = {}
    for row in treinos_ws:
        sid = str(row.get("ID_Split", "")).strip()
        uid = str(row.get("ID_Usuario", "")).strip()
        if uid == id_usuario and sid:
            splits_data[sid] = str(row.get("Nome_Split", sid))

    hoje = date.today()
    # pega séries do usuário
    minhas = [s for s in series if f"_{id_usuario}_" in str(s.get("ID_Treino",""))]

    # agrupa por data_treino único
    dias_treino = set()
    treinos_por_semana = {}  # "YYYY-Www" → {splits, volume, series, prs}
    exerc_cargas = {}  # nome_ex → [(data, carga_max)]

    for s in minhas:
        id_treino = str(s.get("ID_Treino",""))
        data_str  = extrair_data_de_id_treino(id_treino)
        if not data_str: continue
        try: dt = date.fromisoformat(data_str)
        except: continue

        dias_treino.add(data_str)
        semana = dt.strftime("%Y-W%W")
        if semana not in treinos_por_semana:
            treinos_por_semana[semana] = {"semana": semana, "inicio": dt - timedelta(days=dt.weekday()), "dias": set(), "volume": 0.0, "series": 0, "splits": set()}

        tw = treinos_por_semana[semana]
        tw["dias"].add(data_str)
        try:
            carga  = float(s.get("Carga_kg", 0) or 0)
            reps   = int(s.get("Repeticoes", 0) or 0)
            tw["volume"] += carga * reps
            tw["series"] += 1
        except: pass

        split_id_raw = id_treino.split("_")[0] if "_" in id_treino else ""
        nome_split = splits_data.get(split_id_raw, split_id_raw)
        tw["splits"].add(nome_split)

        # rastreia cargas para PRs
        nome_ex = str(s.get("Nome_Exercicio","")).lstrip("[P]").strip()
        try: carga_f = float(s.get("Carga_kg", 0) or 0)
        except: carga_f = 0
        if nome_ex:
            if nome_ex not in exerc_cargas: exerc_cargas[nome_ex] = []
            exerc_cargas[nome_ex].append((data_str, carga_f))

    # PRs desta semana
    inicio_semana = (hoje - timedelta(days=hoje.weekday())).isoformat()
    prs_semana = []
    for nome, registros in exerc_cargas.items():
        registros.sort()
        carga_max_geral = max(c for _, c in registros) if registros else 0
        carga_esta_semana = max((c for d, c in registros if d >= inicio_semana), default=0)
        if carga_esta_semana > 0 and carga_esta_semana >= carga_max_geral:
            prs_semana.append({"exercicio": nome, "carga": carga_esta_semana})

    # streak: quantos dias consecutivos (contando semanas com pelo menos 1 treino)
    streak_dias = 0
    d = hoje
    while True:
        if d.isoformat() in dias_treino:
            streak_dias += 1
        elif d < hoje:  # hoje pode não ter treinado ainda
            break
        d -= timedelta(days=1)
        if streak_dias > 365: break

    # semanas streak (semanas consecutivas com >=1 treino)
    streak_semanas = 0
    semana_check = hoje - timedelta(days=hoje.weekday())
    while True:
        sw = semana_check.strftime("%Y-W%W")
        if sw in treinos_por_semana and len(treinos_por_semana[sw]["dias"]) > 0:
            streak_semanas += 1
        else:
            break
        semana_check -= timedelta(weeks=1)
        if streak_semanas > 52: break

    # últimas 4 semanas
    ultimas4 = []
    for i in range(4):
        seg = hoje - timedelta(days=hoje.weekday()) - timedelta(weeks=i)
        sw = seg.strftime("%Y-W%W")
        tw = treinos_por_semana.get(sw, {})
        ultimas4.append({
            "semana_label": f"{seg.strftime('%d/%m')} – {(seg+timedelta(days=6)).strftime('%d/%m')}",
            "dias_treino": len(tw.get("dias", set())),
            "volume": round(tw.get("volume", 0)),
            "series": tw.get("series", 0),
            "splits": list(tw.get("splits", set())),
        })

    total_treinos = len(set(
        f"{extrair_data_de_id_treino(str(s.get('ID_Treino','')))}__{str(s.get('ID_Treino','')).split('_')[0]}"
        for s in minhas
    ))

    return {
        "streak_dias": streak_dias,
        "streak_semanas": streak_semanas,
        "prs_semana": prs_semana[:10],
        "ultimas_4_semanas": ultimas4,
        "total_treinos_historico": total_treinos,
    }


@app.post("/api/rank/criar")
def rank_criar(req: RankCriar):
    try:
        codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        com_retry(lambda: get_ws("Rank_Lobbies").append_row([codigo, req.nome, req.data_fim, req.id_usuario]))
        com_retry(lambda: get_ws("Rank_Membros").append_row([codigo, req.id_usuario, req.nome_usuario]))
        return {"status": "sucesso", "lobby": {"codigo": codigo, "nome": req.nome, "data_fim": req.data_fim}}
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/api/rank/entrar")
def rank_entrar(req: RankEntrar):
    try:
        lobbies = com_retry(lambda: get_ws("Rank_Lobbies").get_all_records())
        lobby = next((l for l in lobbies if str(l.get("Codigo", "")) == req.codigo), None)
        if not lobby: raise HTTPException(404, "Código inválido")
        membros = com_retry(lambda: get_ws("Rank_Membros").get_all_records())
        if not any(str(m.get("Codigo","")) == req.codigo and str(m.get("ID_Usuario","")) == req.id_usuario for m in membros):
            com_retry(lambda: get_ws("Rank_Membros").append_row([req.codigo, req.id_usuario, req.nome_usuario]))
        return {"status": "sucesso", "lobby": {"codigo": str(lobby.get("Codigo","")), "nome": str(lobby.get("Nome","")), "data_fim": str(lobby.get("Data_Fim",""))}}
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/api/rank/lobbies")
def rank_lobbies(id_usuario: str = Query(...)):
    try:
        membros = com_retry(lambda: get_ws("Rank_Membros").get_all_records())
        meus_codigos = [str(m.get("Codigo", "")) for m in membros if str(m.get("ID_Usuario", "")) == id_usuario]
        res = []
        for l in com_retry(lambda: get_ws("Rank_Lobbies").get_all_records()):
            cod = str(l.get("Codigo", ""))
            if cod in meus_codigos:
                res.append({"codigo": cod, "nome": str(l.get("Nome", "")), "data_fim": str(l.get("Data_Fim", "")), "membros": sum(1 for m in membros if str(m.get("Codigo", "")) == cod)})
        return {"lobbies": res}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/api/rank/ranking")
def rank_ranking(codigo: str = Query(...)):
    try:
        membros_lobby = [m for m in com_retry(lambda: get_ws("Rank_Membros").get_all_records()) if str(m.get("Codigo", "")) == codigo]
        todas_series = com_retry(lambda: get_ws("Series_Exercicios").get_all_records())
        ranking = []
        for m in membros_lobby:
            uid = str(m.get("ID_Usuario", ""))
            dias = {extrair_data_de_id_treino(str(s.get("ID_Treino", ""))) for s in todas_series if f"_{uid}_" in str(s.get("ID_Treino", "")) and extrair_data_de_id_treino(str(s.get("ID_Treino", "")))}
            ranking.append({"id_usuario": uid, "nome": str(m.get("Nome_Usuario", "")), "pontos": len(dias)})
        ranking.sort(key=lambda x: x["pontos"], reverse=True)
        return {"ranking": ranking}
    except Exception as e: raise HTTPException(500, str(e))

# ══════════════════════════════════════════════════════════════════════════════
# NOVAS FEATURES — Peso Corporal, Notas de Treino, Progressão
# ══════════════════════════════════════════════════════════════════════════════

class RegistroPeso(BaseModel):
    id_registro: str
    id_usuario: str
    data: str
    peso_kg: float

class NotaTreino(BaseModel):
    id_nota: str
    id_usuario: str
    id_treino: str   # mesmo ID de sessão usado nas séries
    data: str
    split: str
    nota: str

class ExportarReq(BaseModel):
    id_usuario: str

# ── PESO CORPORAL ─────────────────────────────────────────────────────────────
@app.post("/api/peso")
def registrar_peso(r: RegistroPeso):
    try:
        ws = get_ws("Peso_Corporal")
        com_retry(lambda: ws.append_row([
            r.id_registro, r.id_usuario, r.data, r.peso_kg
        ], value_input_option="USER_ENTERED"))
        cache_del("Peso_Corporal")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/peso")
def buscar_pesos(id_usuario: str = Query(...)):
    try:
        # get_all_values retorna tudo como string — evita distorcao de locale (62,7) e serial de datas
        rows = com_retry(lambda: get_ws("Peso_Corporal").get_all_values())
        if not rows or len(rows) < 2:
            return {"pesos": []}
        # header na linha 0, dados nas seguintes
        header = [h.lower().strip() for h in rows[0]]
        def row_to_dict(r):
            return {header[i]: r[i] if i < len(r) else "" for i in range(len(header))}
        registros = [row_to_dict(r) for r in rows[1:] if any(r)]
        meus = [r for r in registros if str(r.get("id_usuario","")) == id_usuario]
        meus.sort(key=lambda x: str(x.get("data","")))
        result = []
        for r in meus:
            try:
                # substitui virgula por ponto para suportar locale BR
                kg = float(str(r.get("peso_kg","0")).replace(",", "."))
                result.append({"id_registro": r.get("id_registro",""), "data": r.get("data",""), "peso_kg": kg})
            except (ValueError, KeyError):
                continue
        return {"pesos": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/peso")
def deletar_peso(id_registro: str = Query(...)):
    try:
        ws = get_ws("Peso_Corporal")
        todas = com_retry(lambda: ws.get_all_values())
        for i, row in enumerate(todas):
            if i == 0:
                continue
            if row and str(row[0]) == id_registro:
                linha = i + 1
                com_retry(lambda l=linha: ws.delete_rows(l))
                cache_del("Peso_Corporal")
                return {"ok": True}
        raise HTTPException(status_code=404, detail="Registro nao encontrado.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── NOTAS DE TREINO ───────────────────────────────────────────────────────────
@app.post("/api/nota-treino")
def salvar_nota(n: NotaTreino):
    try:
        ws = get_ws("Notas_Treino")
        registros = com_retry(lambda: ws.get_all_records())
        # upsert: atualiza se já existe nota para esse id_treino
        for i, row in enumerate(registros):
            if str(row.get("id_treino","")) == n.id_treino and str(row.get("id_usuario","")) == n.id_usuario:
                com_retry(lambda: ws.update(f"F{i+2}", [[n.nota]]))
                cache_del("Notas_Treino")
                return {"ok": True, "updated": True}
        com_retry(lambda: ws.append_row([
            n.id_nota, n.id_usuario, n.id_treino, n.data, n.split, n.nota
        ], value_input_option="RAW"))
        cache_del("Notas_Treino")
        return {"ok": True, "updated": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nota-treino")
def buscar_notas(id_usuario: str = Query(...), id_treino: str = Query(None)):
    try:
        registros = get_records("Notas_Treino")
        meus = [r for r in registros if str(r.get("id_usuario","")) == id_usuario]
        if id_treino:
            meus = [r for r in meus if str(r.get("id_treino","")) == id_treino]
        return {"notas": [{"id_treino": r["id_treino"], "data": r["data"], "split": r["split"], "nota": r["nota"]} for r in meus]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── PROGRESSÃO AUTOMÁTICA ─────────────────────────────────────────────────────
@app.get("/api/progressao")
def sugestoes_progressao(id_usuario: str = Query(...)):
    """
    Para cada exercício, verifica as últimas 3 sessões.
    Se nas 3 sessões todas as séries foram completadas com a mesma carga,
    sugere aumentar 2,5kg (ou +1 rep se a carga não mudou mas reps aumentaram).
    """
    try:
        series = get_records("Series_Exercicios")
        minhas = [s for s in series if f"_{id_usuario}_" in str(s.get("ID_Treino",""))]

        # agrupa por exercício → data → séries
        por_exercicio: dict = {}
        for s in minhas:
            nome = str(s.get("Nome_Exercicio","")).strip()
            if nome.startswith("[P]"): nome = nome[3:]
            if not nome: continue
            id_treino = str(s.get("ID_Treino",""))
            data = extrair_data_de_id_treino(id_treino)
            if not data: continue
            try:
                carga = float(s.get("Carga_kg", 0) or 0)
                reps  = int(s.get("Repeticoes", 0) or 0)
            except: continue

            if nome not in por_exercicio: por_exercicio[nome] = {}
            if data not in por_exercicio[nome]: por_exercicio[nome][data] = []
            por_exercicio[nome][data].append({"carga": carga, "reps": reps})

        sugestoes = []
        for nome, sessoes_por_data in por_exercicio.items():
            datas = sorted(sessoes_por_data.keys(), reverse=True)
            if len(datas) < 3: continue
            ultimas3 = datas[:3]

            # extrai carga máxima e reps médias de cada sessão
            resumo = []
            for d in ultimas3:
                series_d = sessoes_por_data[d]
                carga_max = max(s["carga"] for s in series_d)
                reps_med  = round(sum(s["reps"] for s in series_d) / len(series_d))
                resumo.append({"data": d, "carga": carga_max, "reps": reps_med})

            # verifica estagnação: mesma carga nas 3 sessões
            cargas = [r["carga"] for r in resumo]
            reps   = [r["reps"]  for r in resumo]
            if len(set(cargas)) == 1 and cargas[0] > 0:
                sugestoes.append({
                    "exercicio": nome,
                    "carga_atual": cargas[0],
                    "reps_atuais": reps[0],
                    "sugestao": "carga",
                    "nova_carga": cargas[0] + 2.5,
                    "sessoes_analisadas": 3,
                })
            elif len(set(cargas)) == 1 and len(set(reps)) > 1 and min(reps) > 0:
                # mesma carga mas reps crescendo → sugere aumentar rep alvo
                sugestoes.append({
                    "exercicio": nome,
                    "carga_atual": cargas[0],
                    "reps_atuais": max(reps),
                    "sugestao": "reps",
                    "nova_carga": cargas[0],
                    "sessoes_analisadas": 3,
                })

        sugestoes.sort(key=lambda x: x["exercicio"])
        return {"sugestoes": sugestoes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── EXPORTAR HISTÓRICO CSV ────────────────────────────────────────────────────
@app.get("/api/exportar-historico")
def exportar_historico(id_usuario: str = Query(...)):
    """Retorna o histórico completo do usuário como JSON para exportação CSV no frontend."""
    try:
        series = get_records("Series_Exercicios")
        minhas = [s for s in series if f"_{id_usuario}_" in str(s.get("ID_Treino",""))]
        registros = []
        for s in minhas:
            id_treino = str(s.get("ID_Treino",""))
            data = extrair_data_de_id_treino(id_treino)
            nome_ex = str(s.get("Nome_Exercicio","")).strip()
            if nome_ex.startswith("[P]"): nome_ex = nome_ex[3:]
            try:
                carga = float(s.get("Carga_kg", 0) or 0)
                reps  = int(s.get("Repeticoes", 0) or 0)
                num   = int(s.get("Numero_Serie", 0) or 0)
            except:
                carga, reps, num = 0, 0, 0
            registros.append({
                "data": data,
                "exercicio": nome_ex,
                "serie": num,
                "carga_kg": carga,
                "repeticoes": reps,
                "volume": round(carga * reps, 1),
            })
        registros.sort(key=lambda x: (x["data"], x["exercicio"], x["serie"]))
        return {"registros": registros}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))