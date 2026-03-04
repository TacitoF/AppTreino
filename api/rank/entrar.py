"""POST /api/rank/entrar"""
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

@app.route('/api/rank/entrar', methods=['POST', 'OPTIONS'])
def entrar():
    if request.method == 'OPTIONS':
        return _cors('', 204)
    try:
        body        = request.get_json(force=True) or {}
        id_usuario  = str(body.get('id_usuario', '')).strip()
        nome_user   = str(body.get('nome_usuario', id_usuario)).strip()
        codigo      = str(body.get('codigo', '')).strip().upper()

        if not all([id_usuario, codigo]):
            return _cors(jsonify({'detail': 'id_usuario e codigo obrigatórios.'}), 400)

        planilha = get_sheet()
        ws       = planilha.worksheet('Rank_Lobbies')
        dados    = ws.get_all_values()

        for i, row in enumerate(dados, start=1):
            if not row or row[0].strip().upper() == 'CODIGO':
                continue
            if row[0].strip() == codigo:
                membros_raw = row[4] if len(row) > 4 else '[]'
                try:
                    membros = json.loads(membros_raw)
                except:
                    membros = []

                # Já é membro?
                ids = [m.get('id_usuario') for m in membros]
                if id_usuario not in ids:
                    membros.append({'id_usuario': id_usuario, 'nome': nome_user})
                    ws.update_cell(i, 5, json.dumps(membros, ensure_ascii=False))

                lobby = {
                    'codigo':   row[0].strip(),
                    'nome':     row[1].strip() if len(row) > 1 else '',
                    'data_fim': row[2].strip() if len(row) > 2 else '',
                    'criador':  row[3].strip() if len(row) > 3 else '',
                    'membros':  len(membros),
                }
                return _cors(jsonify({'status': 'sucesso', 'lobby': lobby}))

        return _cors(jsonify({'detail': 'Lobby não encontrado.'}), 404)
    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)