"""GET /api/rank/lobbies?id_usuario=U001"""
from flask import Flask, request, jsonify, make_response
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from _sheets import get_sheet, exigir_auth, _cors

app = Flask(__name__)

def _cors(response, status=200):
    r = make_response(response, status)
    r.headers['Access-Control-Allow-Origin']  = '*'
    r.headers['Access-Control-Allow-Methods'] = 'GET,POST,DELETE,OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return r

@app.route('/api/rank/lobbies', methods=['GET', 'OPTIONS'])
def lobbies():
    if request.method == 'OPTIONS':
        return _cors('', 204)
    try:
        id_usuario = str(request.args.get('id_usuario', '')).strip()
        if not id_usuario:
            return _cors(jsonify({'detail': 'id_usuario obrigatório.'}), 400)

        planilha = get_sheet()
        ws       = planilha.worksheet('Rank_Lobbies')
        todos    = ws.get_all_records()

        resultado = []
        for lb in todos:
            membros_raw = str(lb.get('Membros_JSON', '[]'))
            try:
                membros = json.loads(membros_raw)
            except:
                membros = []
            ids = [m.get('id_usuario') for m in membros]
            if id_usuario in ids:
                resultado.append({
                    'codigo':   str(lb.get('Codigo', '')),
                    'nome':     str(lb.get('Nome', '')),
                    'data_fim': str(lb.get('Data_Fim', '')),
                    'criador':  str(lb.get('ID_Criador', '')),
                    'membros':  len(membros),
                })

        return _cors(jsonify({'lobbies': resultado}))
    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)