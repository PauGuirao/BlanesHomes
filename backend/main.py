from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import pandas as pd
import uvicorn
import joblib

# ========== INICIALIZACIÓN FASTAPI ==========
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== CARGA DE MODELOS Y DATOS ==========
model_precio = joblib.load("models/modelo_xgboost_precio.pkl")
features_precio = joblib.load("models/features_xgboost_precio.pkl")  # columnas del modelo

model_precio_m2 = joblib.load("models/modelo_precio_m2.pkl")
features_precio_m2 = joblib.load("models/features_precio_m2.pkl")  # columnas del modelo

drop_cols = ['url_id','id','titulo','descripcion','calle','fecha_publicacion', 'zona', 'url','anunciante']
df = pd.read_csv("data/processedFiles/blanes_data_20250417_151255.csv")
# Now add the simple_id after predictions are done
df.reset_index(inplace=True)
df.rename(columns={"index": "id"}, inplace=True)
X = df.drop(columns=drop_cols + ['precio'])
features_precio = list(X.columns)  # columnas del modelo principal

# Agregar columna tipo
tipo_cols = [col for col in df.columns if col.startswith("tipo_")]
df["tipo"] = df[tipo_cols].idxmax(axis=1).str.replace("tipo_", "")

# Predicción inicial y categorización
df['precio_estimado'] = model_precio.predict(df[features_precio])
df['categoria_valor'] = df.apply(lambda row: (
    'ganga' if row['precio'] < row['precio_estimado'] * 0.9 else
    'caro' if row['precio'] > row['precio_estimado'] * 1.1 else
    'justo'
), axis=1)
df['valoracion_score'] = (df['precio'] - df['precio_estimado']) / df['precio_estimado']

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

# ========== ENDPOINTS ==========

@app.get("/pisos")
def get_pisos():
    resultado = df.head(350)
    return resultado[[
        'id', 'latitud', 'longitud', 'metros', 'precio', 'zona',
        'categoria_valor', 'precio_estimado', 'tipo',
        'valoracion_score', 'habitaciones', 'baños', 'antiguedad_dias', 'anunciante', 'url'
    ]].to_dict(orient="records")


@app.post("/estimar_precio")
async def estimar_precio(data: Request):
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

@app.post("/recomendaciones")
def recomendaciones(id: int):
    piso = df[df["id"] == id].iloc[0]
    candidatos = df[
        (df['precio'] <= piso['precio']) &
        (df['id'] != piso['id']) &
        (df['precio_estimado'] > piso['precio_estimado'])
    ].copy()

    candidatos['ganancia_ia'] = candidatos['precio_estimado'] - candidatos['precio']
    recomendados = candidatos.sort_values(by='ganancia_ia', ascending=False).head(5)

    return recomendados.to_dict(orient="records")


@app.post("/sugerencias")
async def sugerencias(data: Request):
    input_data = await data.json()
    df_input = pd.DataFrame([input_data])
    for col in ["habitaciones", "baños", "metros", "precio_estimado"]:
        df_input[col] = pd.to_numeric(df_input[col], errors="coerce")
    
    precio_estimado = input_data.get("precio_estimado")
    margen = 0.10

    min_precio = precio_estimado * (1 - margen)
    max_precio = precio_estimado * (1 + margen)

    # Filtro inicial por precio
    candidatos = df[
        (df["precio"] >= min_precio) &
        (df["precio"] <= max_precio)
    ].copy()

    # Filtros opcionales por zona y tipo
    if "zona" in input_data:
        candidatos = candidatos[candidatos["zona"] == input_data["zona"]]
    if "tipo" in input_data:
        candidatos = candidatos[candidatos["tipo"] == input_data["tipo"]]

    if precio_estimado is None:
        return {"error": "precio_estimado requerido"}, 400

    usuario = df_input.iloc[0]
    candidatos["puntuacion"] = (
        abs(candidatos["habitaciones"] - usuario["habitaciones"]) * 2 +
        abs(candidatos["baños"] - usuario["baños"]) * 1.5 +
        abs(candidatos["metros"] - usuario["metros"]) / 10
    )

    recomendados = candidatos.sort_values(by="puntuacion").head(5)
    # mostrar los valores de recomendados en json
    print(recomendados.to_json(orient="records"))
    return recomendados.to_dict(orient="records")

@app.get("/zona")
def get_zona_stats(id: str = Query(..., description="Nombre de la zona")):
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
    
@app.get("/zona/tendencia")
def zona_tendencia(id: str = Query(..., description="Nombre de la zona")):
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

@app.get("/zona/actividad")
def zona_actividad(id: str = Query(..., description="Nombre de la zona")):
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

@app.get("/zona/gangas")
def zona_gangas(id: str = Query(..., description="Nombre de la zona")):
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
            'id', 'tipo', 'precio', 'precio_estimado', 'metros',
            'habitaciones', 'baños', 'descuento'
        ]].to_dict(orient="records")
    }

@app.get("/comparar")
def comparar_pisos(ids: list[int] = Query(..., description="Lista de IDs de pisos a comparar")):
    pisos = df[df["id"].isin(ids)].copy()

    if pisos.empty:
        return JSONResponse(content={"error": "No se encontraron pisos con esos IDs"}, status_code=404)

    # Asegurar que todos los IDs existen
    encontrados = set(pisos["id"].tolist())
    no_encontrados = [i for i in ids if i not in encontrados]
    if no_encontrados:
        return JSONResponse(content={"error": f"No se encontraron los siguientes IDs: {no_encontrados}"}, status_code=404)

    # Formatear campos extra para comparativa
    pisos["precio_m2"] = (pisos["precio"] / pisos["metros"]).round(2)
    pisos["extras"] = pisos[["terraza", "garaje", "ascensor"]].astype(bool).apply(lambda row: [k for k, v in row.items() if v], axis=1)

    columnas_interes = [
        "id", "titulo", "zona", "tipo", "precio", "metros", "precio_m2",
        "habitaciones", "baños", "valoracion_score", "categoria_valor",
        "extras"
    ]

    return pisos[columnas_interes].to_dict(orient="records")


@app.get("/analisisLink")
def analisisLink(id: int):
    piso_df = df[df["id"] == id]
    
    if piso_df.empty:
        return JSONResponse(content={"error": "No se encontró el piso con ese ID"}, status_code=404)
    
    piso = piso_df.iloc[0]
    
    # Drop simple_id and ensure features match exactly
    features_data = piso[features_precio].copy()
    if 'simple_id' in features_data:
        features_data = features_data.drop('simple_id')
    
    # Ensure all required features are present
    if 'precio_m2' not in features_data:
        features_data['precio_m2'] = piso['precio'] / piso['metros']
    
    # Reorder columns to match the model's expected order
    features_data = features_data[model_precio.feature_names_in_]
    
    precio_estimado = model_precio.predict(features_data.to_frame().T)[0]
    
    return {
        "precio_estimado": int(precio_estimado)
    }

@app.get("/vendedores")
def get_vendedores():
    # Calculate dominant agency and particulars
    anunciantes_count = df["anunciante"].value_counts()
    particulares = df[df["anunciante"].str.contains("particular_", na=False)]["anunciante"].nunique()
    agencia_dominante = anunciantes_count[~anunciantes_count.index.str.contains("particular_", na=False)].index[0]
    propiedades_dominante = anunciantes_count[agencia_dominante]

    # Group data by vendor
    vendedores = df.groupby("anunciante").agg({
        "id": "count",
        "precio": ["mean", "min", "max"],
        "metros": "mean",
        "tipo": lambda x: x.value_counts().to_dict(),
        "zona": lambda x: x.value_counts().to_dict(),
    }).reset_index()

    # Calculate general stats
    stats = {
        "total_agencias": len(vendedores),
        "total_propiedades": len(df),
        "particulares": int(particulares),
        "agencia_dominante": {
            "nombre": agencia_dominante,
            "propiedades": int(propiedades_dominante)
        },
        "precio_medio": round(df["precio"].mean(), 2),
        "metros_medio": round(df["metros"].mean(), 1)
    }

    # Rename columns for clarity
    vendedores.columns = [
        "nombre", "total_propiedades", "precio_medio", 
        "precio_min", "precio_max", "metros_medio",
        "tipos", "zonas"
    ]

    # Round numeric values
    vendedores["precio_medio"] = vendedores["precio_medio"].round(2)
    vendedores["precio_min"] = vendedores["precio_min"].round(2)
    vendedores["precio_max"] = vendedores["precio_max"].round(2)
    vendedores["metros_medio"] = vendedores["metros_medio"].round(1)

    return {
        "stats": stats,
        "vendedores": vendedores.to_dict(orient="records")
    }

@app.get("/vendedor/{nombre}")
def get_vendedor(nombre: str):
    vendedor_df = df[df["anunciante"] == nombre].copy()
    
    if vendedor_df.empty:
        return JSONResponse(
            content={"error": "Vendedor no encontrado"},
            status_code=404
        )

    # Calculate statistics
    stats = {
        "nombre": nombre,
        "total_propiedades": len(vendedor_df),
        "precio_medio": round(vendedor_df["precio"].mean(), 2),
        "precio_min": round(vendedor_df["precio"].min(), 2),
        "precio_max": round(vendedor_df["precio"].max(), 2),
        "metros_medio": round(vendedor_df["metros"].mean(), 1),
        "tipos": vendedor_df["tipo"].value_counts().to_dict(),
        "zonas": vendedor_df["zona"].value_counts().to_dict(),
        "propiedades": vendedor_df[[
            'id', 'tipo', 'zona', 'precio', 'metros',
            'habitaciones', 'baños', 'categoria_valor'
        ]].to_dict(orient="records")
    }

    return stats


@app.get("/comparar")
def comparar_pisos(ids: list[int] = Query(..., description="Lista de IDs de pisos a comparar")):
    pisos = df[df["id"].isin(ids)].copy()

    if pisos.empty:
        return JSONResponse(content={"error": "No se encontraron pisos con esos IDs"}, status_code=404)

    # Asegurar que todos los IDs existen
    encontrados = set(pisos["id"].tolist())
    no_encontrados = [i for i in ids if i not in encontrados]
    if no_encontrados:
        return JSONResponse(content={"error": f"No se encontraron los siguientes IDs: {no_encontrados}"}, status_code=404)

    # Formatear campos extra para comparativa
    pisos["precio_m2"] = (pisos["precio"] / pisos["metros"]).round(2)
    pisos["extras"] = pisos[["terraza", "garaje", "ascensor"]].astype(bool).apply(lambda row: [k for k, v in row.items() if v], axis=1)

    columnas_interes = [
        "id", "titulo", "zona", "tipo", "precio", "metros", "precio_m2",
        "habitaciones", "baños", "valoracion_score", "categoria_valor",
        "extras"
    ]

    return pisos[columnas_interes].to_dict(orient="records")


@app.get("/analisisLink")
def analisisLink(id: int):
    piso_df = df[df["id"] == id]
    
    if piso_df.empty:
        return JSONResponse(content={"error": "No se encontró el piso con ese ID"}, status_code=404)
    
    piso = piso_df.iloc[0]
    
    # Drop simple_id and ensure features match exactly
    features_data = piso[features_precio].copy()
    if 'simple_id' in features_data:
        features_data = features_data.drop('simple_id')
    
    # Ensure all required features are present
    if 'precio_m2' not in features_data:
        features_data['precio_m2'] = piso['precio'] / piso['metros']
    
    # Reorder columns to match the model's expected order
    features_data = features_data[model_precio.feature_names_in_]
    
    precio_estimado = model_precio.predict(features_data.to_frame().T)[0]
    
    return {
        "precio_estimado": int(precio_estimado)
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
