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
        ws = get_sheet().worksheet('Series_Exercicios')

        if request.method == 'POST':
            body = request.get_json(force=True) or {}
            ws.append_row([
                str(body.get('id_serie', '')),
                str(body.get('id_treino', '')),
                str(body.get('nome_exercicio', '')),
                int(body.get('numero_serie', 0)),
                int(body.get('repeticoes', 0)),
                float(body.get('carga_kg', 0)),
            ])
            return _cors(jsonify({'status': 'sucesso'}))

        if request.method == 'DELETE':
            id_serie = str(request.args.get('id', '')).strip()
            if not id_serie:
                return _cors(jsonify({'detail': 'id obrigatório.'}), 400)
            try:
                cel = ws.find(id_serie)
                ws.delete_rows(cel.row)
                return _cors(jsonify({'status': 'sucesso'}))
            except gspread.exceptions.CellNotFound:
                return _cors(jsonify({'detail': 'Série não encontrada.'}), 404)

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)