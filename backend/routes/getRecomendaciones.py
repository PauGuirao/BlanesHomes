from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
import pandas as pd
router = APIRouter()

from deps.dependencies import (
    get_df
)

@router.get("/recomendaciones")
def recomendaciones(id: int, df: pd.DataFrame = Depends(get_df)):
    # Get the reference property
    piso = df[df["id"] == id].iloc[0]
    
    # Filter out the current property
    candidatos = df[df['id'] != piso['id']].copy()
    
    # Calculate similarity score based on multiple factors
    candidatos['similarity_score'] = (
        # Zone match (highest weight)
        (candidatos['zona'] == piso['zona']).astype(int) * 5 +
        # Property type match
        (candidatos['tipo'] == piso['tipo']).astype(int) * 3 +
        # Size similarity (inverse of difference)
        (10 - (abs(candidatos['metros'] - piso['metros']) / 10).clip(0, 10)) * 0.5 +
        # Room count similarity
        (5 - abs(candidatos['habitaciones'] - piso['habitaciones'])).clip(0, 5) * 0.8 +
        # Bathroom count similarity
        (5 - abs(candidatos['baños'] - piso['baños'])).clip(0, 5) * 0.8 +
        # Price range similarity (within 20% of reference price)
        ((candidatos['precio'] >= piso['precio'] * 0.8) & 
         (candidatos['precio'] <= piso['precio'] * 1.2)).astype(int) * 2 +
        # Similar extras count
        (5 - abs(candidatos['n_extras'] - piso['n_extras'])).clip(0, 5) * 0.5
    )
    
    # Get top 5 most similar properties
    recomendados = candidatos.sort_values(by='similarity_score', ascending=False).head(5)
    
    return recomendados.to_dict(orient="records")