# endpoints/analisis_link.py

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from datetime import datetime
import pandas as pd
import json
import re
from deps.dependencies import (
    get_df, get_model_precio, get_features_precio,
    get_supabase, get_gemini_model
)
from auth import get_current_user

router = APIRouter()

def completitud_datos_score(piso: dict) -> int:
    campos_esenciales = [
        'descripcion',
        'metros',
        'habitaciones',
        'baños',
        'zona',
        'latitud',
        'longitud',
        'año_construccion'
    ]
    completados = sum(1 for campo in campos_esenciales if piso.get(campo) not in [None, '', 0, '0', 'nan', 'NaN'])
    return round((completados / len(campos_esenciales)) * 10)

def frescura_score(piso: dict) -> int:
    if 'antiguedad_dias' not in piso or pd.isna(piso['antiguedad_dias']):
        return 0
    dias = piso['antiguedad_dias']
    if dias <= 7: return 10
    elif dias <= 30: return 8
    elif dias <= 60: return 6
    elif dias <= 90: return 4
    elif dias <= 180: return 2
    else: return 0

def valorar_descripcion_titulo(model, descripcion: str, titulo: str) -> str:
    prompt = f"""
    Eres un experto en marketing inmobiliario. Evalúa del 1 al 10 esta descripción inmobiliaria. También valora del 1 al 10 el titulo.

    Titulo: "{titulo}"
    Descripción: "{descripcion}"
    Quiero que me devuelvas un JSON con esta estructura:
    {{
        "valoracion_titulo": (número del 1 al 10),
        "valoracion_descripcion": (número del 1 al 10),
        "titulo_mejorado": "Texto con una versión mejor del título para hacerlo más atractivo",
        "mejoras_descripcion": ["Punto 1 de mejora", "Punto 2 de mejora", ...]
    }}
    """
    try:
        respuesta = model.generate_content(prompt)
        return respuesta.text
    except Exception:
        return '{"valoracion_titulo": 5, "valoracion_descripcion": 5, "titulo_mejorado": "", "mejoras_descripcion": []}'

@router.get("/analisisLink")
def analisis_link(
    id: int = Query(...),
    df: pd.DataFrame = Depends(get_df),
    model_precio = Depends(get_model_precio),
    features_precio = Depends(get_features_precio),
    supabase = Depends(get_supabase),
    model = Depends(get_gemini_model),
    user=Depends(get_current_user)
):
    piso_df = df[df["url_id"].astype(str) == str(id)]
    if piso_df.empty:
        return JSONResponse(content={"error": "No se encontró el piso con ese ID"}, status_code=404)
    
    piso = piso_df.iloc[0]
    features_data = piso[features_precio].copy()

    if 'simple_id' in features_data:
        features_data = features_data.drop('simple_id')
    if 'precio_m2' not in features_data:
        features_data['precio_m2'] = piso['precio'] / piso['metros']

    price_difference = ((piso['precio'] - piso['precio_estimado']) / piso['precio_estimado']) * 100
    score_precio = max(0, 10 - abs(price_difference) / 5)
    score_completitud = completitud_datos_score(piso)
    score_frescura = frescura_score(piso)

    piso_id = int(piso['url_id'])
    existing_rating = supabase.table("ad_ratings").select("*").eq("piso_id", piso_id).execute()

    use_existing_rating = False
    if existing_rating.data:
        updated_at = datetime.fromisoformat(existing_rating.data[0]['updated_at'].replace('Z', '+00:00'))
        time_diff = datetime.now() - updated_at.replace(tzinfo=None)
        if time_diff.total_seconds() < 3600:
            use_existing_rating = True
            score_titulo = existing_rating.data[0]['title_rating'] / 10
            score_descripcion = existing_rating.data[0]['description_rating'] / 10

    if not use_existing_rating:
        valoracion = valorar_descripcion_titulo(model, piso.get("descripcion", ""), piso.get("titulo", ""))
        try:
            json_match = re.search(r'({.*})', valoracion, re.DOTALL)
            data_gemini = json.loads(json_match.group(1)) if json_match else {"valoracion_titulo": 5, "valoracion_descripcion": 5}
        except Exception:
            data_gemini = {"valoracion_titulo": 5, "valoracion_descripcion": 5}
        score_titulo = data_gemini.get("valoracion_titulo", 5)
        score_descripcion = data_gemini.get("valoracion_descripcion", 5)
        new_title = data_gemini.get("titulo_mejorado", piso.get("titulo", ""))
        better_description = data_gemini.get("mejoras_descripcion", "")
    else:
        new_title = piso.get("titulo", "")
        better_description = piso.get("descripcion", "")

    overall_score = round((score_precio + score_completitud + score_frescura + score_titulo + score_descripcion) / 5, 1)
    dias_activo = int(piso["antiguedad_dias"]) if not pd.isna(piso.get("antiguedad_dias", 0)) else 0

    return {
        "piso": {
            "id": piso_id,
            "tipo": piso['tipo'],
            "zona": piso['zona'],
            "precio": int(piso['precio']),
            "metros": int(piso['metros']),
            "habitaciones": int(piso['habitaciones']),
            "baños": int(piso['baños']),
            "categoria_valor": piso['categoria_valor'],
            "descripcion": piso.get("descripcion", ""),
            "titulo": piso.get("titulo", ""),
            "anunciante": piso.get("anunciante", ""),
        },
        "precio_estimado": int(piso['precio_estimado']),
        "price_difference": round(price_difference, 2),
        "valoracion": {
            "overall_score": overall_score,
            "precio": round(score_precio * 10, 0),
            "descripcion": round(score_descripcion * 10, 0),
            "titulo": round(score_titulo * 10, 0),
            "completitud": round(score_completitud * 10, 0),
            "frescura": round(score_frescura * 10, 0)
        },
        "mejoras": {
            "titulo": new_title,
            "descripcion": better_description
        },
        "dias_activo": dias_activo
    }