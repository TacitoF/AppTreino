import os, json
import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

def get_sheet():
    raw = os.environ.get("GOOGLE_CREDENTIALS")
    if not raw:
        raise RuntimeError("GOOGLE_CREDENTIALS não definida.")
    creds = Credentials.from_service_account_info(json.loads(raw), scopes=SCOPES)
    gc = gspread.authorize(creds)
    return gc.open("App Treinos")