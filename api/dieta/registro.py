"""POST /api/dieta/registro"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from _sheets import get_sheet, cors_headers, ok, err

def handler(request, context=None):
    if request.get("method", request.get("httpMethod", "POST")).upper() == "OPTIONS":
        return {"statusCode": 204, "headers": cors_headers(), "body": ""}

    try:
        body = json.loads(request.get("body") or "{}")

        planilha = get_sheet()
        ws       = planilha.worksheet("Dieta_Suplementacao")
        ws.append_row([
            str(body.get("id_registro", "")),
            str(body.get("id_usuario", "")),
            str(body.get("data", "")),
            str(body.get("tipo_refeicao", "")),
            int(body.get("calorias", 0)),
            float(body.get("proteinas_g", 0)),
            float(body.get("carbos_g", 0)),
            float(body.get("gorduras_g", 0)),
            str(body.get("check_agua", "")),
            str(body.get("check_whey", "")),
            str(body.get("check_creatina", "")),
        ])
        return ok({"status": "sucesso"})

    except Exception as e:
        return err(str(e), 500)