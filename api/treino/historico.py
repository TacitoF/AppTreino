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

        # Prefixo: "NomeGrupo_UIDUsuario_"
        # O id_treino agora tem formato: NomeGrupo_UIDUsuario_YYYY-MM-DD_timestamp
        # Mantemos compatibilidade com o formato antigo (sem timestamp)
        prefixo   = f"{nome_treino}_{id_usuario}_"
        registros = [r for r in todas if str(r.get('ID_Treino', '')).startswith(prefixo)]

        if not registros:
            return _cors(jsonify({'series': [], 'data_ultimo': None}))

        # Agrupa por id_treino completo (sessão exata)
        # Ordena pelos id_treino — o maior é o mais recente pois contém timestamp
        ids_treino = sorted({str(r.get('ID_Treino', '')) for r in registros}, reverse=True)
        chave_ultima = ids_treino[0]  # sessão mais recente

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

        # Extrai a data para exibição (parte YYYY-MM-DD do id_treino)
        partes    = chave_ultima.split('_')
        data_exib = partes[-2] if len(partes) >= 4 else partes[-1]

        return _cors(jsonify({'series': series, 'data_ultimo': data_exib}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)