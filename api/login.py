"""POST /api/login"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet, cors_headers, ok, err

def handler(request, context=None):
    # Preflight CORS
    if request.get("method", request.get("httpMethod", "")) == "OPTIONS":
        return {"statusCode": 204, "headers": cors_headers(), "body": ""}

    try:
        body  = json.loads(request.get("body") or "{}")
        email = str(body.get("email", "")).strip()
        senha = str(body.get("senha", "")).strip()

        if not email or not senha:
            return err("E-mail e senha obrigatórios.", 400)

        planilha  = get_sheet()
        ws        = planilha.worksheet("Usuarios")
        registros = ws.get_all_records()

        for user in registros:
            if str(user.get("Email", "")).strip() == email:
                if str(user.get("Senha_Hash", "")).strip() == senha:
                    return ok({
                        "status": "sucesso",
                        "usuario": {
                            "id":    str(user.get("ID_Usuario", "")),
                            "nome":  str(user.get("Nome", "")),
                            "email": str(user.get("Email", "")),
                        },
                    })
                return err("Senha incorreta.", 401)

        return err("Usuário não encontrado.", 404)

    except Exception as e:
        return err(str(e), 500)