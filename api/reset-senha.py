"""POST /api/reset-senha"""
from flask import Flask, request, jsonify
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet, _cors

app = Flask(__name__)

@app.route('/api/reset-senha', methods=['POST', 'OPTIONS'])
def reset_senha():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    try:
        body       = request.get_json(force=True) or {}
        email      = str(body.get('email', '')).strip()
        senha_nova = str(body.get('senha_nova', '')).strip()

        if not email or not senha_nova:
            return _cors(jsonify({'detail': 'E-mail e nova senha obrigatórios.'}), 400)

        if len(senha_nova) < 4:
            return _cors(jsonify({'detail': 'Senha deve ter ao menos 4 caracteres.'}), 400)

        ws     = get_sheet().worksheet('Usuarios')
        dados  = ws.get_all_values()

        for i, row in enumerate(dados, start=1):
            if not row:
                continue
            # Pula cabeçalho
            if row[0].strip().upper() == 'ID_USUARIO':
                continue
            # Coluna C (índice 2) = Email
            if len(row) > 2 and row[2].strip().lower() == email.lower():
                # Coluna D (índice 3) = Senha_Hash
                ws.update_cell(i, 4, senha_nova)
                return _cors(jsonify({'status': 'sucesso', 'mensagem': 'Senha redefinida.'}))

        return _cors(jsonify({'detail': 'E-mail não encontrado.'}), 404)

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)