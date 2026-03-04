from flask import Flask, request, jsonify, make_response
import gspread, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from _sheets import get_sheet

app = Flask(__name__)

def _cors(response, status=200):
    r = make_response(response, status)
    r.headers['Access-Control-Allow-Origin']  = '*'
    r.headers['Access-Control-Allow-Methods'] = 'GET,POST,DELETE,OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return r

@app.route('/api/treino/serie', methods=['POST', 'DELETE', 'OPTIONS'])
def serie():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    try:
        planilha = get_sheet()
        ws       = planilha.worksheet('Series_Exercicios')

        # ── POST — registra nova série ────────────────────────────────────────
        if request.method == 'POST':
            body = request.get_json(force=True) or {}

            id_serie       = str(body.get('id_serie', '')).strip()
            id_treino      = str(body.get('id_treino', '')).strip()
            nome_exercicio = str(body.get('nome_exercicio', '')).strip()
            numero_serie   = int(body.get('numero_serie', 0))
            repeticoes     = int(body.get('repeticoes', 0))
            carga_kg       = float(body.get('carga_kg', 0))

            if not id_serie or not id_treino or not nome_exercicio:
                return _cors(jsonify({'detail': 'Campos obrigatórios ausentes.'}), 400)

            # Verifica se já existe (idempotência — evita duplicata se o cliente retentou)
            try:
                existing = ws.find(id_serie, in_column=1)
                if existing:
                    return _cors(jsonify({'status': 'sucesso', 'aviso': 'já existia'}))
            except gspread.exceptions.CellNotFound:
                pass  # Normal — não existe ainda, prossegue

            ws.append_row([id_serie, id_treino, nome_exercicio, numero_serie, repeticoes, carga_kg])
            return _cors(jsonify({'status': 'sucesso'}))

        # ── DELETE — remove série pelo id_serie ───────────────────────────────
        if request.method == 'DELETE':
            id_serie = str(request.args.get('id', '')).strip()
            if not id_serie:
                return _cors(jsonify({'detail': 'id obrigatório.'}), 400)
            try:
                cel = ws.find(id_serie, in_column=1)
                ws.delete_rows(cel.row)
                return _cors(jsonify({'status': 'sucesso'}))
            except gspread.exceptions.CellNotFound:
                # Já não existe — trata como sucesso (operação idempotente)
                return _cors(jsonify({'status': 'sucesso', 'aviso': 'não encontrada'}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)