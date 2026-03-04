"""POST /api/registro"""
from flask import Flask, request, jsonify
from datetime import date
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet, _cors

app = Flask(__name__)

@app.route('/api/registro', methods=['POST', 'OPTIONS'])
def registro():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    try:
        body     = request.get_json(force=True) or {}
        nome     = str(body.get('nome', '')).strip()
        email    = str(body.get('email', '')).strip()
        senha    = str(body.get('senha', '')).strip()
        peso     = str(body.get('peso_atual', '')).strip()
        objetivo = str(body.get('objetivo', '')).strip()

        if not all([nome, email, senha]):
            return _cors(jsonify({'detail': 'Nome, e-mail e senha obrigatórios.'}), 400)

        ws        = get_sheet().worksheet('Usuarios')
        registros = ws.get_all_records()

        for user in registros:
            if str(user.get('Email', '')).strip() == email:
                return _cors(jsonify({'detail': 'E-mail já cadastrado.'}), 400)

        novo_id = f"U{len(registros) + 1:03d}"
        ws.append_row([novo_id, nome, email, senha, date.today().isoformat(), peso, objetivo])

        return _cors(jsonify({'status': 'sucesso', 'mensagem': 'Conta criada!'}), 200)

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)