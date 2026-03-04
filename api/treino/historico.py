"""GET /api/treino/historico"""
from flask import Flask, request, jsonify
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from _sheets import get_sheet, exigir_auth, _cors

app = Flask(__name__)

@app.route('/api/treino/historico', methods=['GET', 'OPTIONS'])
def historico():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    auth, erro = exigir_auth()
    if erro:
        return erro

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

        # Pega o id_treino mais recente — o maior lexicograficamente
        # (funciona tanto com formato antigo YYYY-MM-DD quanto novo com timestamp)
        ids_treino   = sorted({str(r.get('ID_Treino', '')) for r in registros}, reverse=True)
        chave_ultima = ids_treino[0]

        series = [
            {
                'id_serie':       str(r.get('ID_Serie', '')),
                'id_treino':      str(r.get('ID_Treino', '')),
                'nome_exercicio': str(r.get('Nome_Exercicio', '')),
                'numero_serie':   int(r.get('Numero_da_Serie', 0)),
                'repeticoes':     int(r.get('Repeticoes', 0)),
                'carga_kg':       float(r.get('Carga_kg', 0)),
            }
            for r in registros if str(r.get('ID_Treino', '')) == chave_ultima
        ]

        # Extrai data para exibição
        partes    = chave_ultima.split('_')
        data_exib = partes[-2] if len(partes) >= 4 else partes[-1]

        return _cors(jsonify({'series': series, 'data_ultimo': data_exib}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)