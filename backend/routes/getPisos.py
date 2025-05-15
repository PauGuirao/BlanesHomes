
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
import pandas as pd
router = APIRouter()

from deps.dependencies import (
    get_df
)
from auth import get_current_user

@router.get("/pisos")
def get_pisos(ciudad: str = Query(..., description="Nombre de la ciudad"), df: pd.DataFrame = Depends(get_df), user=Depends(get_current_user)):
    resultado = df[df["city"].str.strip().str.lower() == ciudad.strip().lower()]
    if resultado.empty:
        print("No se encontraron pisos para la ciudad especificada")

    return resultado[[
        'id', 'latitud', 'longitud', 'metros', 'precio', 'zona',
        'categoria_valor', 'precio_estimado', 'tipo',
        'valoracion_score', 'habitaciones', 'baños', 'antiguedad_dias', 'anunciante', 'url', 'terraza', 'jardin', 'garaje', 'piscina', 'ascensor', 'balcon', 'n_extras', 'ocupado'
    ]].to_dict(orient="records")