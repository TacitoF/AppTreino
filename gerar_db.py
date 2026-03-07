import csv
import json

NOME_ARQUIVO_CSV = 'tabela.csv'
NOVO_DB = 'alimentosDB_novo.js'

alimentos = []

def limpar_valor(valor):
    v = valor.strip().upper() # Remove espaços e deixa tudo maiúsculo
    # Se for traços, NA, tracinho ou vazio, transforma em zero
    if v in ['TR', 'NA', '-', '', 'N/A']:
        return '0'
    # Troca a vírgula do Excel pelo ponto do Python
    return v.replace(',', '.')

with open(NOME_ARQUIVO_CSV, mode='r', encoding='utf-8-sig') as f:
    leitor = csv.reader(f, delimiter=',') 
    
    next(leitor, None) # Pula o cabeçalho
    
    for i, linha in enumerate(leitor):
        try:
            if not linha or len(linha) < 5:
                continue
                
            nome = linha[0].strip()
            kcal_str = limpar_valor(linha[1])
            prot_str = limpar_valor(linha[2])
            carb_str = limpar_valor(linha[3])
            gord_str = limpar_valor(linha[4])
            
            alimentos.append({
                "id": str(i + 1),
                "nome": nome,
                "kcal": round(float(kcal_str)),
                "proteina": round(float(prot_str), 1),
                "carbo": round(float(carb_str), 1),
                "gordura": round(float(gord_str), 1)
            })
        except Exception as e:
            print(f"Aviso: Linha ignorada por erro de formatação: {linha} | Erro: {e}")

with open(NOVO_DB, mode='w', encoding='utf-8') as f:
    f.write("export const ALIMENTOS_DB = ")
    f.write(json.dumps(alimentos, indent=2, ensure_ascii=False))
    f.write(";\n")

print(f"✨ Sucesso Total! {len(alimentos)} alimentos foram convertidos sem erros.")