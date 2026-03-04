"""
_sheets.py — helper compartilhado entre todas as funções serverless.
Lê as credenciais da variável de ambiente GOOGLE_CREDENTIALS (JSON string).
"""
import os
import json
import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

def get_sheet():
    """Abre a planilha 'App Treinos' usando credenciais da env var."""
    raw = os.environ.get("GOOGLE_CREDENTIALS")
    if not raw:
        raise RuntimeError("Variável de ambiente GOOGLE_CREDENTIALS não definida.")
    info = json.loads(raw)
    creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    gc = gspread.authorize(creds)
    return gc.open("App Treinos")

def cors_headers():
    """Headers CORS para todas as respostas."""
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

def ok(data: dict, status: int = 200):
    return {"statusCode": status, "headers": cors_headers(), "body": json.dumps(data, ensure_ascii=False)}

def err(msg: str, status: int = 500):
    return {"statusCode": status, "headers": cors_headers(), "body": json.dumps({"detail": msg})}