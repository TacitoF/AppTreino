from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ._sheets import get_ws, com_retry
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class RegistroCardio(BaseModel):
    id_registro: str
    id_usuario:  str
    data:        str
    atividade:   str
    label:       str
    intensidade: str
    minutos:     int
    peso_kg:     float
    kcal:        int
    met:         float


@router.post("/cardio")
def registrar_cardio(registro: RegistroCardio):
    logger.info(f"[cardio POST] usuario={registro.id_usuario} atividade={registro.atividade} kcal={registro.kcal}")
    try:
        com_retry(lambda: get_ws("Cardio").append_row([
            registro.id_registro,
            registro.id_usuario,
            registro.data,
            registro.atividade,
            registro.label,
            registro.intensidade,
            registro.minutos,
            registro.peso_kg,
            registro.kcal,
            registro.met,
        ]))
        logger.info(f"[cardio POST] gravado: {registro.id_registro}")
        return {"status": "sucesso"}
    except Exception as e:
        import traceback
        logger.error(f"[cardio POST] ERRO:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")


@router.get("/cardio")
def buscar_cardio(id_usuario: str = Query(...), limite: int = Query(5)):
    try:
        todas = com_retry(lambda: get_ws("Cardio").get_all_records())
        meus = [r for r in todas if str(r.get("ID_Usuario", "")) == id_usuario.strip()]
        meus.sort(key=lambda r: (str(r.get("Data", "")), str(r.get("ID_Registro", ""))), reverse=True)
        registros = []
        for r in meus[:limite]:
            try:
                registros.append({
                    "id_registro": str(r.get("ID_Registro", "")),
                    "data":        str(r.get("Data", "")),
                    "atividade":   str(r.get("Atividade", "")),
                    "label":       str(r.get("Label", "")),
                    "intensidade": str(r.get("Intensidade", "")),
                    "minutos":     int(r.get("Minutos", 0)),
                    "peso_kg":     float(r.get("Peso_kg", 0)),
                    "kcal":        int(r.get("Kcal", 0)),
                })
            except (ValueError, TypeError):
                continue
        return {"registros": registros}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))