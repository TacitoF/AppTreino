"""GET /api/treino/historico?id_usuario=U001&nome_treino=Peito"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from _sheets import get_sheet, cors_headers, ok, err

def handler(request, context=None):
    if request.get("method", request.get("httpMethod", "GET")).upper() == "OPTIONS":
        return {"statusCode": 204, "headers": cors_headers(), "body": ""}

    try:
        params      = request.get("queryStringParameters") or {}
        id_usuario  = str(params.get("id_usuario", "")).strip()
        nome_treino = str(params.get("nome_treino", "")).strip()

        if not id_usuario or not nome_treino:
            return err("id_usuario e nome_treino obrigatórios.", 400)

        planilha = get_sheet()
        ws       = planilha.worksheet("Series_Exercicios")
        todas    = ws.get_all_records()

        prefixo   = f"{nome_treino}_{id_usuario}_"
        registros = [r for r in todas if str(r.get("ID_Treino", "")).startswith(prefixo)]

        if not registros:
            return ok({"series": [], "data_ultimo": None})

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

        return ok({"series": series, "data_ultimo": ultima})

    except Exception as e:
        return err(str(e), 500)