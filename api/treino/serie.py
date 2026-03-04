"""
POST   /api/treino/serie            → registra série
DELETE /api/treino/serie?id=SXXX    → deleta série pelo ID
"""
import json, sys, os
import gspread
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from _sheets import get_sheet, cors_headers, ok, err

def handler(request, context=None):
    method = request.get("method", request.get("httpMethod", "POST")).upper()

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": cors_headers(), "body": ""}

    try:
        planilha = get_sheet()
        ws       = planilha.worksheet("Series_Exercicios")

        # ── POST — registra nova série ────────────────────────────────────────
        if method == "POST":
            body = json.loads(request.get("body") or "{}")
            ws.append_row([
                str(body.get("id_serie", "")),
                str(body.get("id_treino", "")),
                str(body.get("nome_exercicio", "")),
                int(body.get("numero_serie", 0)),
                int(body.get("repeticoes", 0)),
                float(body.get("carga_kg", 0)),
            ])
            return ok({"status": "sucesso"})

        # ── DELETE — remove série pelo id_serie ───────────────────────────────
        if method == "DELETE":
            params   = request.get("queryStringParameters") or {}
            id_serie = str(params.get("id", "")).strip()

            if not id_serie:
                # Tenta extrair do path: /api/treino/serie/SXXX
                path = request.get("path", "")
                id_serie = path.rstrip("/").split("/")[-1]

            if not id_serie:
                return err("id da série obrigatório.", 400)

            try:
                cel = ws.find(id_serie)
                ws.delete_rows(cel.row)
                return ok({"status": "sucesso"})
            except gspread.exceptions.CellNotFound:
                return err("Série não encontrada.", 404)

        return err("Método não permitido.", 405)

    except Exception as e:
        return err(str(e), 500)