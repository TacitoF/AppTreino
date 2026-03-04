"""POST /api/registro"""
import json, sys, os
from datetime import date
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet, cors_headers, ok, err

def handler(request, context=None):
    if request.get("method", request.get("httpMethod", "")) == "OPTIONS":
        return {"statusCode": 204, "headers": cors_headers(), "body": ""}

    try:
        body      = json.loads(request.get("body") or "{}")
        nome      = str(body.get("nome", "")).strip()
        email     = str(body.get("email", "")).strip()
        senha     = str(body.get("senha", "")).strip()
        peso      = str(body.get("peso_atual", "")).strip()
        objetivo  = str(body.get("objetivo", "")).strip()

        if not all([nome, email, senha]):
            return err("Nome, e-mail e senha obrigatórios.", 400)

        planilha  = get_sheet()
        ws        = planilha.worksheet("Usuarios")
        registros = ws.get_all_records()

        for user in registros:
            if str(user.get("Email", "")).strip() == email:
                return err("E-mail já cadastrado.", 400)

        novo_id = f"U{len(registros) + 1:03d}"
        ws.append_row([novo_id, nome, email, senha, date.today().isoformat(), peso, objetivo])

        return ok({"status": "sucesso", "mensagem": "Conta criada!"})

    except Exception as e:
        return err(str(e), 500)