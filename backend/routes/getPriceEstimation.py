
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
router = APIRouter()

from deps.dependencies import (
    get_model_precio, get_features_precio,
    get_model_precio_m2, get_features_precio_m2,
)

# Coordenadas por zona
zona_coords = {
    "Centre": (41.673774, 2.791094),
    "La Plantera": (41.668101, 2.774309),
    "Els Pins": (41.662931, 2.781882),
    "Els Pavos": (41.675115, 2.781567),
    "Semicentre": (41.678307, 2.787425),
    "Mont Ferrant - Sant Joan": (41.678658, 2.794806),
    "Cala Sant Francesc - Santa Cristina": (41.679922, 2.806074)
}

from auth import get_current_user

@router.post("/estimar_precio")
async def estimar_precio(data: Request, model_precio = Depends(get_model_precio), features_precio = Depends(get_features_precio), model_precio_m2= Depends(get_model_precio_m2), features_precio_m2= Depends(get_features_precio_m2)):
    input_data = await data.json()
    df_input = pd.DataFrame([input_data])

    # Conversión segura de tipos
    for col in ['metros', 'habitaciones', 'baños']:
        df_input[col] = pd.to_numeric(df_input[col], errors='coerce')

    # Feature engineering
    df_input["ratio_habitaciones_baños"] = df_input["habitaciones"] / (df_input["baños"] + 1e-5)

    zona = df_input.loc[0, "zona"]
    if pd.isna(zona):
        raise HTTPException(status_code=400, detail="Zona es requerida")

    # Añadir latitud/longitud
    lat, lon = zona_coords.get(zona, (41.675, 2.792))
    df_input["latitud"] = lat
    df_input["longitud"] = lon

    extras_cols = [
    'terraza',
    'jardin',
    'garaje',
    'piscina',
    'ascensor',
    'balcon',
    ]
    df_input["n_extras"] = df_input[extras_cols].sum(axis=1)

    # ========== PASO 1: PREDICCION DE PRECIO_M2 ==========
    df_m2_encoded = pd.get_dummies(df_input)
    bool_cols = df_m2_encoded.select_dtypes(include='bool').columns
    df_m2_encoded[bool_cols] = df_m2_encoded[bool_cols].astype(int)

    # Completar con columnas faltantes
    for col in features_precio_m2:
        if col not in df_m2_encoded:
            df_m2_encoded[col] = 0
    df_m2_encoded = df_m2_encoded[features_precio_m2]
    # mostrar los valores de df_m2_encoded en json
    #print(df_m2_encoded.to_json(orient="records"))

    # Predecir precio_m2 y añadirlo al input original
    precio_m2_estimado = model_precio_m2.predict(df_m2_encoded)[0]
    # muestra el precio_m2_estimado
    #print(f"Precio m2 estimado: {precio_m2_estimado}")
    df_input["precio_m2"] = float(precio_m2_estimado)

    # ========== PASO 2: PREDICCION DE PRECIO ==========
    df_encoded = pd.get_dummies(df_input)
    bool_cols = df_encoded.select_dtypes(include='bool').columns
    df_encoded[bool_cols] = df_encoded[bool_cols].astype(int)

    for col in features_precio:
        if col not in df_encoded:
            df_encoded[col] = 0
    df_encoded = df_encoded[features_precio]
    print(df_encoded.to_json(orient="records"))
    precio_estimado = model_precio.predict(df_encoded)[0]

    return {
        "precio_estimado": int(precio_estimado),
    }
