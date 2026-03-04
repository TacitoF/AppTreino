import gspread
from google.oauth2.service_account import Credentials

# 1. Definir os escopos (o que o script tem permissão para acessar)
scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

# 2. Carregar as credenciais do "usuário robô"
credentials = Credentials.from_service_account_file("credentials.json", scopes=scopes)

# 3. Autenticar e conectar
client = gspread.authorize(credentials)

# 4. Abrir a planilha principal pelo nome
planilha = client.open("App Treinos")

# --- TESTE 1: INSERINDO CARGA DE TREINO ---
aba_series = planilha.worksheet("Series_Exercicios")

# Dados: ID_Serie, ID_Treino, Nome_Exercicio, Numero_da_Serie, Repeticoes, Carga_kg
nova_serie = ["S001", "T001", "Agachamento Livre", 1, 12, 40]
aba_series.append_row(nova_serie)
print("Carga de treino registrada com sucesso!")

# --- TESTE 2: INSERINDO REGISTRO DE DIETA E SUPLEMENTOS ---
aba_dieta = planilha.worksheet("Dieta_Suplementacao")

# Dados: ID_Registro, ID_Usuario, Data, Tipo_Refeicao, Calorias, Proteinas_g, Carbos_g, Gorduras_g, Check_Agua, Check_Whey, Check_Creatina
novo_registro_dieta = ["D001", "U001", "2026-03-04", "Pós-treino", 450, 35, 60, 5, "Sim", "Sim", "Sim"]
aba_dieta.append_row(novo_registro_dieta)
print("Suplementação e dieta registradas com sucesso!")