"""POST /api/login"""
from flask import Flask, request, jsonify
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet, gerar_token, _cors

app = Flask(__name__)

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    try:
        body      = request.get_json(force=True) or {}
        login_val = str(body.get('email', '') or body.get('nome', '')).strip()
        senha     = str(body.get('senha', '')).strip()

        if not login_val or not senha:
            return _cors(jsonify({'detail': 'E-mail ou nome e senha obrigatórios.'}), 400)

        ws        = get_sheet().worksheet('Usuarios')
        registros = ws.get_all_records()

        is_email = '@' in login_val

        if is_email:
            # E-mail é único — busca direta
            for user in registros:
                if str(user.get('Email', '')).strip().lower() == login_val.lower():
                    if str(user.get('Senha_Hash', '')).strip() == senha:
                        uid  = str(user.get('ID_Usuario', ''))
                        nome = str(user.get('Nome', ''))
                        return _cors(jsonify({
                            'status':  'sucesso',
                            'token':   gerar_token(uid, nome),
                            'usuario': {'id': uid, 'nome': nome, 'email': str(user.get('Email', '')).strip()},
                        }), 200)
                    return _cors(jsonify({'detail': 'Senha incorreta.'}), 401)
            return _cors(jsonify({'detail': 'Usuário não encontrado.'}), 404)

        else:
            # Nome pode ter duplicatas — coleta todos com esse nome e testa a senha em cada um
            candidatos = [
                u for u in registros
                if str(u.get('Nome', '')).strip().lower() == login_val.lower()
            ]
            if not candidatos:
                return _cors(jsonify({'detail': 'Usuário não encontrado.'}), 404)

            for user in candidatos:
                if str(user.get('Senha_Hash', '')).strip() == senha:
                    uid  = str(user.get('ID_Usuario', ''))
                    nome = str(user.get('Nome', ''))
                    return _cors(jsonify({
                        'status':  'sucesso',
                        'token':   gerar_token(uid, nome),
                        'usuario': {'id': uid, 'nome': nome, 'email': str(user.get('Email', '')).strip()},
                    }), 200)

            # Nenhum dos candidatos com esse nome teve a senha correta
            return _cors(jsonify({'detail': 'Senha incorreta.'}), 401)

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)