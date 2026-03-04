"""GET /api/rank/ranking?codigo=ABC123"""
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

@app.route('/api/rank/ranking', methods=['GET', 'OPTIONS'])
def ranking():
    if request.method == 'OPTIONS':
        return _cors('', 204)
    try:
        codigo = str(request.args.get('codigo', '')).strip().upper()
        if not codigo:
            return _cors(jsonify({'detail': 'codigo obrigatório.'}), 400)

        planilha = get_sheet()

        # Busca o lobby
        ws_lb  = planilha.worksheet('Rank_Lobbies')
        lobbies = ws_lb.get_all_values()
        lobby   = None
        for row in lobbies:
            if not row or row[0].strip().upper() == 'CODIGO':
                continue
            if row[0].strip() == codigo:
                lobby = row
                break

        if not lobby:
            return _cors(jsonify({'detail': 'Lobby não encontrado.'}), 404)

        data_fim_str = lobby[2].strip() if len(lobby) > 2 else ''
        membros_raw  = lobby[4] if len(lobby) > 4 else '[]'
        try:
            membros = json.loads(membros_raw)
        except:
            membros = []

        # Pega data de criação do lobby a partir do código (não temos campo, usa data mínima)
        # Buscamos todos os treinos e filtramos pelo período
        ws_series = planilha.worksheet('Series_Exercicios')
        series    = ws_series.get_all_records()

        # Pontuação: 1 ponto por dia que o usuário treinou (independente de quantos grupos treinou)
        # Um "dia treinado" = ao menos 1 ID_Treino com a data daquele dia
        # ID_Treino formato: NomeGrupo_UIDUsuario_YYYY-MM-DD_timestamp
        dias_treinados = {}  # id_usuario → set de datas únicas (YYYY-MM-DD)
        for membro in membros:
            dias_treinados[membro['id_usuario']] = set()

        for s in series:
            id_treino = str(s.get('ID_Treino', ''))
            if not id_treino:
                continue
            partes = id_treino.split('_')
            if len(partes) < 3:
                continue
            # Posição fixa: penúltimo = uid, antepenúltimo pode variar; data sempre é YYYY-MM-DD
            # Busca a data pelo formato: qualquer parte que combine com YYYY-MM-DD
            uid_treino  = None
            data_treino = None
            for j, p in enumerate(partes):
                if len(p) == 10 and p[4] == '-' and p[7] == '-':
                    data_treino = p
                    # uid é a parte imediatamente antes da data
                    if j > 0:
                        uid_treino = partes[j - 1]
                    break

            if not uid_treino or not data_treino:
                continue

            # Filtra datas após o encerramento do lobby
            if data_fim_str and data_treino > data_fim_str:
                continue

            if uid_treino in dias_treinados:
                dias_treinados[uid_treino].add(data_treino)

        # Monta ranking — pontos = número de dias distintos treinados
        resultado = []
        for membro in membros:
            uid = membro['id_usuario']
            resultado.append({
                'id_usuario': uid,
                'nome':       membro.get('nome', uid),
                'pontos':     len(dias_treinados.get(uid, set())),
            })

        resultado.sort(key=lambda x: x['pontos'], reverse=True)
        return _cors(jsonify({'ranking': resultado, 'data_fim': data_fim_str}))

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)