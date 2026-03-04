"""GET /api/splits  |  POST /api/splits"""
from flask import Flask, request, jsonify
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet, exigir_auth, _cors

app = Flask(__name__)

@app.route('/api/splits', methods=['GET', 'POST', 'OPTIONS'])
def splits():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    auth, erro = exigir_auth()
    if erro:
        return erro

    try:
        ws = get_sheet().worksheet('Treinos')

        if request.method == 'GET':
            id_usuario = str(request.args.get('id_usuario', '')).strip()
            if not id_usuario:
                return _cors(jsonify({'detail': 'id_usuario obrigatório.'}), 400)

            todas = ws.get_all_values()
            for row in todas:
                if not row or not row[0].strip():
                    continue
                if row[0].strip().upper() == 'ID_USUARIO':
                    continue
                if row[0].strip() == id_usuario:
                    raw = row[1] if len(row) > 1 else '[]'
                    return _cors(jsonify({'splits': json.loads(raw) if raw else [], 'encontrado': True}))

            return _cors(jsonify({'splits': [], 'encontrado': False}))

        if request.method == 'POST':
            body        = request.get_json(force=True) or {}
            id_usuario  = str(body.get('id_usuario', '')).strip()
            splits_list = body.get('splits', [])
            splits_json = json.dumps(splits_list, ensure_ascii=False)

            dados = ws.get_all_values()
            for i, row in enumerate(dados, start=1):
                if not row or not row[0].strip():
                    continue
                if row[0].strip().upper() == 'ID_USUARIO':
                    continue
                if row[0].strip() == id_usuario:
                    ws.update_cell(i, 2, splits_json)
                    return _cors(jsonify({'status': 'sucesso', 'mensagem': 'Splits atualizados.'}))

            ws.append_row([id_usuario, splits_json])
            return _cors(jsonify({'status': 'sucesso', 'mensagem': 'Splits salvos.'}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)