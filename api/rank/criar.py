"""POST /api/rank/criar"""
from flask import Flask, request, jsonify, make_response
import json, random, string, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from _sheets import get_sheet, exigir_auth, _cors

app = Flask(__name__)

def _cors(response, status=200):
    r = make_response(response, status)
    r.headers['Access-Control-Allow-Origin']  = '*'
    r.headers['Access-Control-Allow-Methods'] = 'GET,POST,DELETE,OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return r

def gerar_codigo(existentes):
    while True:
        cod = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if cod not in existentes:
            return cod

@app.route('/api/rank/criar', methods=['POST', 'OPTIONS'])
def criar():
    if request.method == 'OPTIONS':
        return _cors('', 204)
    try:
        body       = request.get_json(force=True) or {}
        id_usuario = str(body.get('id_usuario', '')).strip()
        nome       = str(body.get('nome', '')).strip()
        data_fim   = str(body.get('data_fim', '')).strip()
        nome_user  = str(body.get('nome_usuario', id_usuario)).strip()

        if not all([id_usuario, nome, data_fim]):
            return _cors(jsonify({'detail': 'id_usuario, nome e data_fim obrigatórios.'}), 400)

        planilha = get_sheet()
        ws       = planilha.worksheet('Rank_Lobbies')
        existentes = [str(r.get('Codigo', '')) for r in ws.get_all_records()]

        codigo  = gerar_codigo(set(existentes))
        membro  = [{'id_usuario': id_usuario, 'nome': nome_user}]
        ws.append_row([codigo, nome, data_fim, id_usuario, json.dumps(membro, ensure_ascii=False)])

        lobby = {'codigo': codigo, 'nome': nome, 'data_fim': data_fim, 'criador': id_usuario, 'membros': 1}
        return _cors(jsonify({'status': 'sucesso', 'lobby': lobby}))
    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)