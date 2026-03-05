"""POST /api/treino/serie/nome — atualiza o nome_exercicio de séries já salvas"""
from flask import Flask, request, jsonify
import gspread, sys, os

_api_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)
from _sheets import get_sheet, exigir_auth, _cors

app = Flask(__name__)

@app.route('/api/treino/serie/nome', methods=['POST', 'OPTIONS'])
def atualizar_nome():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    auth, erro = exigir_auth()
    if erro:
        return erro

    try:
        body           = request.get_json(force=True) or {}
        ids            = body.get('ids', [])           # lista de id_serie
        nome_exercicio = str(body.get('nome_exercicio', '')).strip()

        if not ids or not nome_exercicio:
            return _cors(jsonify({'detail': 'ids e nome_exercicio obrigatórios.'}), 400)

        ws    = get_sheet().worksheet('Series_Exercicios')
        todas = ws.get_all_values()

        # Monta mapa id_serie → linha (1-indexed)
        mapa = {}
        for i, row in enumerate(todas, start=1):
            if row and row[0].strip() in ids:
                mapa[row[0].strip()] = i

        if not mapa:
            return _cors(jsonify({'status': 'sucesso', 'atualizados': 0}))

        # Atualiza em batch — uma célula por vez mas dentro de uma única conexão
        # A coluna C (índice 3) é Nome_Exercicio
        atualizados = 0
        for id_serie, linha in mapa.items():
            ws.update_cell(linha, 3, nome_exercicio)
            atualizados += 1

        return _cors(jsonify({'status': 'sucesso', 'atualizados': atualizados}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)