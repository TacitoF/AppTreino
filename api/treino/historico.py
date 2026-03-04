from flask import Flask, request, jsonify, make_response
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from _sheets import get_sheet

app = Flask(__name__)

def _cors(response, status=200):
    r = make_response(response, status)
    r.headers['Access-Control-Allow-Origin']  = '*'
    r.headers['Access-Control-Allow-Methods'] = 'GET,POST,DELETE,OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return r

@app.route('/api/treino/historico', methods=['GET', 'OPTIONS'])
def historico():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    try:
        id_usuario  = str(request.args.get('id_usuario', '')).strip()
        nome_treino = str(request.args.get('nome_treino', '')).strip()

        if not id_usuario or not nome_treino:
            return _cors(jsonify({'detail': 'id_usuario e nome_treino obrigatórios.'}), 400)

        ws    = get_sheet().worksheet('Series_Exercicios')
        todas = ws.get_all_records()

        prefixo   = f"{nome_treino}_{id_usuario}_"
        registros = [r for r in todas if str(r.get('ID_Treino', '')).startswith(prefixo)]

        if not registros:
            return _cors(jsonify({'series': [], 'data_ultimo': None}))

        datas  = {str(r.get('ID_Treino', '')).split('_')[-1] for r in registros}
        ultima = max(datas)
        chave  = f"{prefixo}{ultima}"

        series = [
            {
                'id_serie':       str(r.get('ID_Serie', '')),
                'id_treino':      str(r.get('ID_Treino', '')),
                'nome_exercicio': str(r.get('Nome_Exercicio', '')),
                'numero_serie':   int(r.get('Numero_da_Serie', 0)),
                'repeticoes':     int(r.get('Repeticoes', 0)),
                'carga_kg':       float(r.get('Carga_kg', 0)),
            }
            for r in registros if str(r.get('ID_Treino', '')) == chave
        ]

        return _cors(jsonify({'series': series, 'data_ultimo': ultima}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)