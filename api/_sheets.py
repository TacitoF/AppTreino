import os, json, hmac, hashlib, time, base64
import gspread
from google.oauth2.service_account import Credentials
from flask import request, jsonify, make_response

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# ─── JWT SIMPLES (sem biblioteca externa) ─────────────────────────────────────
# Usa HMAC-SHA256. Não precisa do pacote PyJWT.
# Segredo lido da env var JWT_SECRET — se não definido, usa fallback (apenas dev).

def _secret():
    return os.environ.get("JWT_SECRET", "fitapp-dev-secret-troque-em-producao").encode()

def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _unb64(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def gerar_token(id_usuario: str, nome: str) -> str:
    """Gera um JWT com expiração de 30 dias."""
    header  = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64(json.dumps({
        "sub": id_usuario,
        "nom": nome,
        "exp": int(time.time()) + 60 * 60 * 24 * 30,  # 30 dias
    }).encode())
    sig = _b64(hmac.new(_secret(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

def verificar_token(token: str) -> dict | None:
    """Retorna o payload se válido, None se inválido ou expirado."""
    try:
        header, payload, sig = token.split(".")
        esperado = _b64(hmac.new(_secret(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, esperado):
            return None
        dados = json.loads(_unb64(payload))
        if dados.get("exp", 0) < int(time.time()):
            return None
        return dados
    except Exception:
        return None

def exigir_auth():
    """
    Decorator/helper para validar Bearer token.
    Retorna (payload, None) se válido.
    Retorna (None, resposta_erro) se inválido.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, (_cors(jsonify({"detail": "Token ausente."}), 401))
    payload = verificar_token(auth[7:])
    if payload is None:
        return None, (_cors(jsonify({"detail": "Token inválido ou expirado."}), 401))
    return payload, None

# ─── GOOGLE SHEETS ────────────────────────────────────────────────────────────

def get_sheet():
    raw = os.environ.get("GOOGLE_CREDENTIALS")
    if not raw:
        raise RuntimeError("GOOGLE_CREDENTIALS não definida.")
    creds = Credentials.from_service_account_info(json.loads(raw), scopes=SCOPES)
    gc = gspread.authorize(creds)
    return gc.open("App Treinos")

# ─── CORS ─────────────────────────────────────────────────────────────────────

def _cors(response, status=200):
    r = make_response(response, status)
    r.headers["Access-Control-Allow-Origin"]  = "*"
    r.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
    r.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    return r