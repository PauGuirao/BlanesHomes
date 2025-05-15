from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
import pandas as pd
from datetime import datetime
router = APIRouter()

from deps.dependencies import (
    get_df
)

@router.get("/zona")
def get_zona_stats(id: str = Query(..., description="Nombre de la zona"), df: pd.DataFrame = Depends(get_df)):
    df_zona = df[df["zona"] == id]

    if df_zona.empty:
        return JSONResponse(content={"error": "Zona no encontrada"}, status_code=404)

    # Estadísticas básicas
    total_propiedades = len(df_zona)
    precio_medio = round(df_zona["precio"].mean(), 2)
    
    # Evitar divisiones por cero
    df_zona = df_zona[df_zona["metros"] > 0].copy()

    # Precio medio por m² y m² medio
    df_zona["precio_m2"] = df_zona["precio"] / df_zona["metros"]
    precio_m2 = round(df_zona["precio_m2"].mean(), 2)
    metros_medio = round(df_zona["metros"].mean(), 1)

    # Tiempo medio de publicación
    if "fecha_publicacion" in df_zona.columns:
        df_zona["fecha_publicacion"] = pd.to_datetime(df_zona["fecha_publicacion"])
        df_zona["antiguedad_dias"] = (datetime.now() - df_zona["fecha_publicacion"]).dt.days
        tiempo_medio_venta = round(df_zona["antiguedad_dias"].mean(), 1)
    else:
        tiempo_medio_venta = None

    # Distribución por tipo de vivienda
    tipo_counts = df_zona["tipo"].value_counts(normalize=True) * 100
    tipos = {k: round(v, 1) for k, v in tipo_counts.items()}

    # Tendencia de precio en los últimos 6 meses
    df_zona["mes"] = df_zona["fecha_publicacion"].dt.to_period("M")
    precios_mes = df_zona.groupby("mes")["precio_m2"].mean().reset_index()
    precios_mes = precios_mes.sort_values("mes")

    tendencia = "sin datos"
    variacion_pct = None
    if len(precios_mes) >= 6:
        precio_inicio = precios_mes.iloc[-6]["precio_m2"]
        precio_actual = precios_mes.iloc[-1]["precio_m2"]
        variacion_pct = round(((precio_actual - precio_inicio) / precio_inicio) * 100, 2)
        tendencia = (
            "subiendo" if variacion_pct > 1 else
            "bajando" if variacion_pct < -1 else
            "estable"
        )

    return {
        "zona": id,
        "total_propiedades": total_propiedades,
        "precio_medio": precio_medio,
        "precio_m2": precio_m2,
        "metros_medio": metros_medio,
        "tiempo_medio_venta": tiempo_medio_venta,
        "tipos": tipos,
        "tendencia": tendencia,
        "variacion_pct": variacion_pct
    }

@router.get("/zona/tendencia")
def zona_tendencia(id: str = Query(..., description="Nombre de la zona"), df: pd.DataFrame = Depends(get_df)):
    df_zona = df[df["zona"] == id].copy()

    if df_zona.empty:
        return JSONResponse(content={"error": "Zona no encontrada"}, status_code=404)

    if "fecha_publicacion" not in df_zona.columns or "precio" not in df_zona.columns or "metros" not in df_zona.columns:
        return JSONResponse(content={"error": "Datos insuficientes para calcular tendencia"}, status_code=400)

    df_zona = df_zona[df_zona["metros"] > 0]
    df_zona["fecha_publicacion"] = pd.to_datetime(df_zona["fecha_publicacion"])
    df_zona["precio_m2"] = df_zona["precio"] / df_zona["metros"]
    df_zona["mes"] = df_zona["fecha_publicacion"].dt.to_period("M").astype(str)

    serie = (
        df_zona.groupby("mes")["precio_m2"]
        .mean()
        .reset_index()
        .sort_values("mes")
    )

    if len(serie) < 2:
        return JSONResponse(content={"error": "No hay suficientes datos para mostrar la tendencia"}, status_code=400)

    precio_inicio = serie.iloc[-6]["precio_m2"] if len(serie) >= 6 else serie.iloc[0]["precio_m2"]
    precio_actual = serie.iloc[-1]["precio_m2"]
    variacion_pct = round(((precio_actual - precio_inicio) / precio_inicio) * 100, 2)

    tendencia = (
        "subiendo" if variacion_pct > 1 else
        "bajando" if variacion_pct < -1 else
        "estable"
    )

    return {
        "zona": id,
        "variacion_pct": variacion_pct,
        "tendencia": tendencia,
        "serie": [
            {"mes": row["mes"], "precio_m2": round(row["precio_m2"], 2)}
            for _, row in serie.iterrows()
        ]
    }

@router.get("/zona/actividad")
def zona_actividad(id: str = Query(..., description="Nombre de la zona"), df: pd.DataFrame = Depends(get_df)):
    df_zona = df[df["zona"] == id].copy()

    if df_zona.empty:
        return JSONResponse(content={"error": "Zona no encontrada"}, status_code=404)

    if "fecha_publicacion" not in df_zona.columns:
        return JSONResponse(content={"error": "No hay fecha de publicación disponible"}, status_code=400)

    df_zona["fecha_publicacion"] = pd.to_datetime(df_zona["fecha_publicacion"], errors="coerce")
    df_zona = df_zona[df_zona["fecha_publicacion"].notna()]

    df_zona["mes"] = df_zona["fecha_publicacion"].dt.to_period("M").astype(str)
    actividad = (
        df_zona.groupby("mes")
        .size()
        .reset_index(name="anuncios")
        .sort_values("mes")
    )

    return {
        "zona": id,
        "actividad": [
            {"mes": row["mes"], "anuncios": int(row["anuncios"])}
            for _, row in actividad.iterrows()
        ]
    }

@router.get("/zona/gangas")
def zona_gangas(id: str = Query(..., description="Nombre de la zona"), df: pd.DataFrame = Depends(get_df)):
    df_zona = df[df["zona"] == id].copy()

    if df_zona.empty:
        return JSONResponse(content={"error": "Zona no encontrada"}, status_code=404)

    # Filter properties that are at least 10% below their estimated price
    gangas = df_zona[
        (df_zona['precio'] < df_zona['precio_estimado'] * 0.9) &
        (df_zona['categoria_valor'] == 'ganga')
    ].copy()

    # Calculate discount percentage
    gangas['descuento'] = round(
        ((gangas['precio_estimado'] - gangas['precio']) / gangas['precio_estimado']) * 100,
        1
    )

    # Sort by highest discount and get top 5
    gangas = gangas.sort_values('descuento', ascending=False).head(5)

    return {
        "zona": id,
        "gangas": gangas[[
            'descuento','id', 'latitud', 'longitud', 'metros', 'precio', 'zona',
        'categoria_valor', 'precio_estimado', 'tipo',
        'valoracion_score', 'habitaciones', 'baños', 'antiguedad_dias', 'anunciante', 'url', 'terraza', 'jardin', 'garaje', 'piscina', 'ascensor', 'balcon' 
        ]].to_dict(orient="records")
    }