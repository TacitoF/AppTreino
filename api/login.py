from flask import Flask, request, jsonify
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _sheets import get_sheet

app = Flask(__name__)

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return _cors('', 204)

    try:
        body  = request.get_json(force=True) or {}
        email = str(body.get('email', '')).strip()
        senha = str(body.get('senha', '')).strip()

        if not email or not senha:
            return _cors(jsonify({'detail': 'E-mail e senha obrigatórios.'}), 400)

        ws        = get_sheet().worksheet('Usuarios')
        registros = ws.get_all_records()

        for user in registros:
            if str(user.get('Email', '')).strip() == email:
                if str(user.get('Senha_Hash', '')).strip() == senha:
                    return _cors(jsonify({
                        'status': 'sucesso',
                        'usuario': {
                            'id':    str(user.get('ID_Usuario', '')),
                            'nome':  str(user.get('Nome', '')),
                            'email': str(user.get('Email', '')),
                        }
                    }), 200)
                return _cors(jsonify({'detail': 'Senha incorreta.'}), 401)

        return _cors(jsonify({'detail': 'Usuário não encontrado.'}), 404)

    except Exception as e:
        return _cors(jsonify({'detail': str(e)}), 500)


def _cors(response, status=200):
    from flask import make_response
    r = make_response(response, status)
    r.headers['Access-Control-Allow-Origin']  = '*'
    r.headers['Access-Control-Allow-Methods'] = 'GET,POST,DELETE,OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return r