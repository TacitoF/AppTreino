"""GET /api/treino/historico"""
from flask import Flask, request, jsonify
import sys, os

# Garante que api/ está no path independente de onde o Vercel executa
_api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

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
        split_id    = str(request.args.get('split_id', '')).strip()

        if not id_usuario:
            return _cors(jsonify({'detail': 'id_usuario obrigatório.'}), 400)

        ws    = get_sheet().worksheet('Series_Exercicios')
        todas = ws.get_all_records()

        # Monta prefixos: novo formato (split_id) + fallback por nome
        prefixos = []
        if split_id:
            prefixos.append(f"{split_id}_{id_usuario}_")
        if nome_treino:
            prefixos.append(f"{nome_treino}_{id_usuario}_")

        if not prefixos:
            return _cors(jsonify({'detail': 'nome_treino ou split_id obrigatório.'}), 400)

        registros = [
            r for r in todas
            if any(str(r.get('ID_Treino', '')).startswith(p) for p in prefixos)
        ]

        if not registros:
            return _cors(jsonify({'series': [], 'data_ultimo': None}))

        # Pega o id_treino mais recente pelo timestamp embutido no ID
        def chave_ordenacao(id_treino):
            partes = id_treino.split('_')
            # Extrai data YYYY-MM-DD
            data = next((p for p in partes if len(p) == 10 and p[4] == '-'), '')
            # Extrai timestamp numérico final
            ts = next((p for p in reversed(partes) if p.isdigit() and len(p) >= 10), '0')
            return (data, ts)

        ids_treino   = sorted({str(r.get('ID_Treino', '')) for r in registros},
                              key=chave_ordenacao, reverse=True)
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
        data_exib = next((p for p in partes if len(p) == 10 and p[4] == '-'), partes[-1])

        return _cors(jsonify({'series': series, 'data_ultimo': data_exib}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)