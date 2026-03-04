"""
GET  /api/splits?id_usuario=U001   → busca splits
POST /api/splits                   → salva splits  (body: {id_usuario, splits})
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet, cors_headers, ok, err

def handler(request, context=None):
    method = request.get("method", request.get("httpMethod", "GET")).upper()

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": cors_headers(), "body": ""}

    try:
        planilha = get_sheet()
        ws       = planilha.worksheet("Treinos")

        # ── GET — busca splits do usuário ─────────────────────────────────────
        if method == "GET":
            params     = request.get("queryStringParameters") or {}
            id_usuario = str(params.get("id_usuario", "")).strip()

            if not id_usuario:
                return err("Parâmetro id_usuario obrigatório.", 400)

            todas = ws.get_all_values()
            for row in todas:
                if not row or not row[0].strip():
                    continue
                if row[0].strip().upper() == "ID_USUARIO":
                    continue
                if row[0].strip() == id_usuario:
                    raw    = row[1] if len(row) > 1 else "[]"
                    splits = json.loads(raw) if raw else []
                    return ok({"splits": splits, "encontrado": True})

            return ok({"splits": [], "encontrado": False})

        # ── POST — salva/atualiza splits ──────────────────────────────────────
        if method == "POST":
            body       = json.loads(request.get("body") or "{}")
            id_usuario = str(body.get("id_usuario", "")).strip()
            splits     = body.get("splits", [])

            if not id_usuario:
                return err("id_usuario obrigatório.", 400)

            splits_json = json.dumps(splits, ensure_ascii=False)
            dados       = ws.get_all_values()

            for i, row in enumerate(dados, start=1):
                if not row or not row[0].strip():
                    continue
                if row[0].strip().upper() == "ID_USUARIO":
                    continue
                if row[0].strip() == id_usuario:
                    ws.update_cell(i, 2, splits_json)
                    return ok({"status": "sucesso", "mensagem": "Splits atualizados."})

            ws.append_row([id_usuario, splits_json])
            return ok({"status": "sucesso", "mensagem": "Splits salvos."})

        return err("Método não permitido.", 405)

    except json.JSONDecodeError as e:
        return err(f"JSON inválido: {str(e)}", 500)
    except Exception as e:
        return err(str(e), 500)