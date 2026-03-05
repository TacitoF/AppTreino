"""POST /api/cardio  |  GET /api/cardio"""
from flask import Flask, request, jsonify
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet, exigir_auth, _cors

app = Flask(__name__)

@app.route('/api/cardio', methods=['GET', 'POST', 'OPTIONS'])
def cardio():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    auth, erro = exigir_auth()
    if erro:
        return erro

    try:
        if request.method == 'POST':
            body = request.get_json(force=True) or {}

            id_registro = str(body.get('id_registro', '')).strip()
            id_usuario  = str(body.get('id_usuario',  '')).strip()
            data        = str(body.get('data',        '')).strip()
            atividade   = str(body.get('atividade',   '')).strip()
            label       = str(body.get('label',       '')).strip()
            intensidade = str(body.get('intensidade', '')).strip()
            minutos     = int(body.get('minutos',     0))
            peso_kg     = float(body.get('peso_kg',   0))
            kcal        = int(body.get('kcal',        0))
            met         = float(body.get('met',       0))

            if not id_registro or not id_usuario:
                return _cors(jsonify({'detail': 'id_registro e id_usuario obrigatórios.'}), 400)

            ws = get_sheet().worksheet('Cardio')
            ws.append_row([
                id_registro, id_usuario, data,
                atividade, label, intensidade,
                minutos, peso_kg, kcal, met,
            ])
            return _cors(jsonify({'status': 'sucesso'}))

        if request.method == 'GET':
            id_usuario = str(request.args.get('id_usuario', '')).strip()
            limite     = int(request.args.get('limite', 5))

            if not id_usuario:
                return _cors(jsonify({'detail': 'id_usuario obrigatório.'}), 400)

            ws    = get_sheet().worksheet('Cardio')
            todas = ws.get_all_records()

            meus = [r for r in todas if str(r.get('ID_Usuario', '')).strip() == id_usuario]
            meus.sort(
                key=lambda r: (str(r.get('Data', '')), str(r.get('ID_Registro', ''))),
                reverse=True
            )

            registros = []
            for r in meus[:limite]:
                try:
                    registros.append({
                        'id_registro': str(r.get('ID_Registro', '')),
                        'data':        str(r.get('Data', '')),
                        'atividade':   str(r.get('Atividade', '')),
                        'label':       str(r.get('Label', '')),
                        'intensidade': str(r.get('Intensidade', '')),
                        'minutos':     int(r.get('Minutos', 0)),
                        'peso_kg':     float(r.get('Peso_kg', 0)),
                        'kcal':        int(r.get('Kcal', 0)),
                    })
                except (ValueError, TypeError):
                    continue

            return _cors(jsonify({'registros': registros}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)