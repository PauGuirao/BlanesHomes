from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
import pandas as pd
router = APIRouter()

from deps.dependencies import (
    get_df_zonas
)
from auth import get_current_user

@router.get("/zonas")
def get_zonas(ciudad: str = Query(..., description="Nombre de la ciudad"), df_zonas: pd.DataFrame = Depends(get_df_zonas), user=Depends(get_current_user)):
    df_zona = df_zonas[df_zonas["ciudad"].str.strip().str.lower() == ciudad.strip().lower()]
    if df_zona.empty:
        print("No se encontraron zonas para la ciudad especificada")
    return df_zona[["id", "nombre", "ciudad", "poligon"]].to_dict(orient="records")