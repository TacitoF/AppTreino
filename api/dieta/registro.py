from flask import Flask, request, jsonify
import sys
import os

# Adiciona a pasta 'api' ao caminho para podermos importar o _sheets.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _sheets import get_sheet, _cors

app = Flask(__name__)

# Liberamos a rota para GET (buscar) e POST (salvar)
@app.route('/api/dieta/registro', methods=['GET', 'POST', 'OPTIONS'])
def dieta_handler():
    # Responde ao "Preflight" do navegador (CORS)
    if request.method == 'OPTIONS':
        return _cors("", 200)

    try:
        # Conecta ao Google Sheets
        planilha = get_sheet()
        ws = planilha.worksheet("Dieta_Suplementacao")

        # SE O APP QUISER LER A DIETA DE HOJE
        if request.method == 'GET':
            id_usuario = request.args.get('id_usuario', '').strip()
            data_busca = request.args.get('data', '').strip()
            
            todas = ws.get_all_records()
            meus = [
                r for r in todas
                if str(r.get("ID_Usuario", "")) == id_usuario and str(r.get("Data", "")) == data_busca
            ]
            return _cors(jsonify({"registros": meus}), 200)

        # SE O APP QUISER SALVAR UMA NOVA COMIDA
        if request.method == 'POST':
            dados = request.get_json()
            
            nova_linha = [
                dados.get('id_registro', ''),
                dados.get('id_usuario', ''),
                dados.get('data', ''),
                dados.get('tipo_refeicao', ''),
                dados.get('calorias', 0),
                dados.get('proteinas_g', 0),
                dados.get('carbos_g', 0),
                dados.get('gorduras_g', 0),
                dados.get('check_agua', ''),
                dados.get('check_whey', ''),
                dados.get('check_creatina', '')
            ]
            
            ws.append_row(nova_linha)
            return _cors(jsonify({"status": "sucesso"}), 200)

    except Exception as e:
        return _cors(jsonify({"detail": str(e)}), 500)