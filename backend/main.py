from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import pandas as pd
import uvicorn
import joblib
import json


from dotenv import load_dotenv
load_dotenv()
from supabase import create_client, Client
import os

import google.generativeai as genai
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

# ========== INICIALIZACIÓN FASTAPI ==========
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== CONEXIÓN A SUPABASE ==========
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ========== CARGA DE MODELOS ==========
model_precio = joblib.load("models/modelo_xgboost_precio.pkl")
features_precio = joblib.load("models/features_xgboost_precio.pkl")  # columnas del modelo

model_precio_m2 = joblib.load("models/modelo_precio_m2.pkl")
features_precio_m2 = joblib.load("models/features_precio_m2.pkl")  # columnas del modelo

# ========== CARGA DE DATOS DESDE SUPABASE ==========
response = supabase.table("pisos").select("*").not_.is_("descripcion", None).execute()
records = response.data
df = pd.DataFrame(records)

drop_cols = ['url_id','id','titulo','descripcion','calle','fecha_publicacion', 'zona', 'url','anunciante', 'city', 'agencia_id', 'activo']
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
    resultado = df
    return resultado[[
        'id', 'latitud', 'longitud', 'metros', 'precio', 'zona',
        'categoria_valor', 'precio_estimado', 'tipo',
        'valoracion_score', 'habitaciones', 'baños', 'antiguedad_dias', 'anunciante', 'url', 'terraza', 'jardin', 'garaje', 'piscina', 'ascensor', 'balcon', 'n_extras', 'ocupado'
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

    candidatos = df[
        (df["precio"] >= min_precio) &
        (df["precio"] <= max_precio)
    ].copy()

    if "zona" in input_data:
        candidatos = candidatos[candidatos["zona"] == input_data["zona"]]
    if "tipo" in input_data:
        candidatos = candidatos[candidatos["tipo"] == input_data["tipo"]]

    if precio_estimado is None:
        return {"error": "precio_estimado requerido"}, 400

    usuario = df_input.iloc[0]
    max_diff = 10  # Define a maximum difference threshold for normalization
    candidatos["puntuacion"] = 100 - (
        (abs(candidatos["habitaciones"] - usuario["habitaciones"]) * 2 +
         abs(candidatos["baños"] - usuario["baños"]) * 1.5 +
         abs(candidatos["metros"] - usuario["metros"]) / 10) / max_diff * 100
    ).clip(lower=0)  # Ensure score doesn't go below 0

    recomendados = candidatos.sort_values(by="puntuacion", ascending=False).head(5)
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
            'descuento','id', 'latitud', 'longitud', 'metros', 'precio', 'zona',
        'categoria_valor', 'precio_estimado', 'tipo',
        'valoracion_score', 'habitaciones', 'baños', 'antiguedad_dias', 'anunciante', 'url', 'terraza', 'jardin', 'garaje', 'piscina', 'ascensor', 'balcon' 
        ]].to_dict(orient="records")
    }

@app.get("/comparar")
def comparar_pisos(ids: list[int] = Query(..., description="Lista de IDs de pisos a comparar")):
    pisos = df[df["id"].isin(ids)].copy()

    if pisos.empty:
        return JSONResponse(content={"error": "No se encontraron pisos con esos IDs"}, status_code=404)

    # Asegurar que todos los IDs existen
    encontrados = set(pisos["id"].tolist())
    no_encontrados = [i for i in encontrados if i not in encontrados]
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
    piso_df = df[df["url_id"].astype(str) == str(id)]
    if piso_df.empty:
        return JSONResponse(content={"error": "No se encontró el piso con ese ID"}, status_code=404)
    
    piso = piso_df.iloc[0]

    # --- PREDICCIÓN DE PRECIO ---
    features_data = piso[features_precio].copy()
    if 'simple_id' in features_data:
        features_data = features_data.drop('simple_id')

    if 'precio_m2' not in features_data:
        features_data['precio_m2'] = piso['precio'] / piso['metros']

    features_data = features_data[model_precio.feature_names_in_]
    features_data = features_data.apply(pd.to_numeric, errors="coerce")
    precio_estimado = model_precio.predict(features_data.to_frame().T)[0]
    price_difference = ((piso['precio'] - precio_estimado) / precio_estimado) * 100

    # ---------- CALCULO DE NOTAS ------------ #
    score_precio = max(0, 10 - (abs(piso['precio'] - precio_estimado) / precio_estimado) * 100 / 5)
    score_completitud = completitud_datos_score(piso)
    score_frescura = frescura_score(piso)

    # --- CHECK IF RECENT RATING EXISTS IN DATABASE ---
    piso_id = int(piso['url_id'])
    existing_rating = supabase.table("ad_ratings") \
        .select("*") \
        .eq("piso_id", piso_id) \
        .execute()
    
    use_existing_rating = False
    if existing_rating.data:
        # Check if the rating is less than an hour old
        updated_at = datetime.fromisoformat(existing_rating.data[0]['updated_at'].replace('Z', '+00:00'))
        time_diff = datetime.now() - updated_at.replace(tzinfo=None)
        
        # If less than an hour old, use the existing rating
        if time_diff.total_seconds() < 3600:  # 3600 seconds = 1 hour
            use_existing_rating = True
            score_titulo = existing_rating.data[0]['title_rating'] / 10
            score_descripcion = existing_rating.data[0]['description_rating'] / 10
            print(f"Using existing rating from database (updated {time_diff.total_seconds()/60:.1f} minutes ago)")
    
    if not use_existing_rating:
        # --- VALORAR DESCRIPCIÓN y TITULO CON GEMINI ---
        descripcion = piso.get("descripcion", "")
        titulo = piso.get("titulo", "")

        # Llamada a la función de Gemini
        valoración_gemini = valorar_descripcion_titulo(descripcion, titulo)
        print(valoración_gemini)
        
        # Extract JSON from the response text
        try:
            import re
            json_match = re.search(r'({.*})', valoración_gemini, re.DOTALL)
            if json_match:
                data_gemini = json.loads(json_match.group(1))
            else:
                # Fallback if no JSON pattern is found
                data_gemini = {"valoracion_titulo": 5, "valoracion_descripcion": 5}
        except Exception as e:
            print(f"Error parsing Gemini response: {e}")
            data_gemini = {"valoracion_titulo": 5, "valoracion_descripcion": 5}
        
        score_titulo = data_gemini.get("valoracion_titulo", 5)
        score_descripcion = data_gemini.get("valoracion_descripcion", 5)

    # --- CALCULAR SCORE FINAL ---
    overall_score = round((score_precio + score_completitud + score_frescura + score_titulo + score_descripcion) / 5, 1)

    # Convert numpy.int64 to Python int to avoid serialization issues
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
            "titulo": piso.get("titulo", "")
        },
        "precio_estimado": int(precio_estimado),
        "price_difference": round(price_difference, 2),
        "valoracion": {
            "overall_score": overall_score,
            "precio": round(score_precio * 10, 0),
            "descripcion": round(score_descripcion * 10, 0),
            "titulo": round(score_titulo * 10, 0),
            "completitud": round(score_completitud * 10, 0),
            "frescura": round(score_frescura * 10, 0)
        },
        "dias_activo": dias_activo
    }

@app.get("/analiza_agencia")
def analiza_agencia(user_id: str = Query(...)):
    # Obtener ID de la agencia asociada al usuario
    agencia = supabase.table("agencias").select("*").eq("user_id", user_id).single().execute().data
    print(agencia)
    if not agencia:
        raise HTTPException(status_code=404, detail="Agencia no encontrada")

    # Obtener pisos de la agencia
    # Filtrar del df global los pisos de esta agencia (ya tienen precio_estimado calculado)
    df_agencia = df[df["agencia_id"] == agencia["id"]].copy()
    if df_agencia.empty:
        return JSONResponse(content={"mensaje": "Esta agencia aún no tiene pisos"}, status_code=200)

    # Calcular métricas generales
    total_propiedades = len(df_agencia)
    precio_medio = df_agencia["precio"].mean()
    metros_medio = df_agencia["metros"].mean()
    precio_m2 = (df_agencia["precio"] / df_agencia["metros"]).mean()

    # Distribuciones
    distribucion_zona = df_agencia["zona"].value_counts().to_dict()

    # Distribución tipo desde columnas tipo_*
    tipo_cols = [col for col in df_agencia.columns if col.startswith("tipo_")]
    distribucion_tipo = {
        col.replace("tipo_", ""): int(df_agencia[col].sum())
        for col in tipo_cols
    }

    # Antigüedad media del anuncio
    if "fecha_publicacion" in df_agencia.columns:
        df_agencia["fecha_publicacion"] = pd.to_datetime(df_agencia["fecha_publicacion"], errors='coerce')
        df_agencia = df_agencia[df_agencia["fecha_publicacion"].notnull()]
        df_agencia["antiguedad_dias"] = (datetime.now() - df_agencia["fecha_publicacion"]).dt.days
        antiguedad_media = df_agencia["antiguedad_dias"].mean()
    else:
        antiguedad_media = None

    # Tamaño medio
    habitaciones_medio = df_agencia["habitaciones"].mean()
    baños_medio = df_agencia["baños"].mean()

    return {
        "agencia_nombre": agencia["nombre"],
        "agencia_id": agencia["id"],
        "total_propiedades": total_propiedades,
        "precio_medio": round(precio_medio, 2),
        "metros_medio": round(metros_medio, 2),
        "precio_m2_medio": round(precio_m2, 2),
        "distribucion_zona": distribucion_zona,
        "distribucion_tipo": distribucion_tipo,
        "antiguedad_media_dias": round(antiguedad_media, 1) if antiguedad_media else "No disponible",
        "habitaciones_medio": round(habitaciones_medio, 2),
        "baños_medio": round(baños_medio, 2),
        "pisos": df_agencia.to_dict(orient="records")
    }

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

    completados = sum(
        1 for campo in campos_esenciales
        if piso.get(campo) not in [None, '', 0, '0', 'nan', 'NaN']
    )

    score = round((completados / len(campos_esenciales)) * 10)
    return score

def frescura_score(piso: dict) -> int:
    if 'antiguedad_dias' not in piso or pd.isna(piso['antiguedad_dias']):
        return 0

    dias = piso['antiguedad_dias']
    if dias <= 7:
        return 10
    elif dias <= 30:
        return 8
    elif dias <= 60:
        return 6
    elif dias <= 90:
        return 4
    elif dias <= 180:
        return 2
    else:
        return 0

# funcion para valorar descripcion y titulo con gemini
def valorar_descripcion_titulo(descripcion: str, titulo: str) -> str:
    prompt = f"""
    Evalúa del 1 al 10 esta descripción inmobiliaria. También valora del 1 al 10 el titulo.

    Titulo: "{titulo}"
    Descripción: "{descripcion}"
    Devuélveme una respuesta JSON con esta estructura:
    {{
        "valoracion_titulo": (número del 1 al 10),
        "valoracion_descripcion": (número del 1 al 10)
    }}
    """
    try:
        respuesta = model.generate_content(prompt)
        texto = respuesta.text
        return texto
    except Exception as e:
        print(f"Error al generar valoración con Gemini: {e}")
        return '{"valoracion_titulo": 5, "valoracion_descripcion": 5}'

# Add this endpoint after your existing endpoints

@app.post("/saveRating")
async def save_rating(request: Request):
    try:
        data = await request.json()
        
        # Extract data from request
        piso_id = data.get('piso_id')
        description_rating = data.get('description_rating')
        price_rating = data.get('price_rating')
        title_rating = data.get('title_rating')
        completeness_rating = data.get('completeness_rating')
        freshness_rating = data.get('freshness_rating')
        general_rating = data.get('general_rating')
        
        # Validate required fields
        if piso_id is None:
            return JSONResponse(
                content={"success": False, "message": "piso_id is required"}, 
                status_code=400
            )
        
        # Check if a record already exists for this property
        existing_rating = supabase.table("ad_ratings") \
            .select("*") \
            .eq("piso_id", piso_id) \
            .execute()
            
        current_time = datetime.now().isoformat()
        
        if existing_rating.data:
            # Update existing record
            result = supabase.table("ad_ratings") \
                .update({
                    "description_rating": description_rating,
                    "price_rating": price_rating,
                    "title_rating": title_rating,
                    "completeness_rating": completeness_rating,
                    "freshness_rating": freshness_rating,
                    "general_rating": general_rating,
                    "updated_at": current_time
                }) \
                .eq("piso_id", piso_id) \
                .execute()
        else:
            # Insert new record
            result = supabase.table("ad_ratings") \
                .insert({
                    "piso_id": piso_id,
                    "description_rating": description_rating,
                    "price_rating": price_rating,
                    "title_rating": title_rating,
                    "completeness_rating": completeness_rating,
                    "freshness_rating": freshness_rating,
                    "general_rating": general_rating,
                    "created_at": current_time,
                    "updated_at": current_time
                }) \
                .execute()
        
        if result.data:
            return {"success": True, "message": "Rating saved successfully"}
        else:
            return JSONResponse(
                content={"success": False, "message": "Failed to save rating", "error": str(result.error)}, 
                status_code=500
            )
            
    except Exception as e:
        print(f"Error saving rating: {e}")
        return JSONResponse(
            content={"success": False, "message": "Error saving rating", "error": str(e)}, 
            status_code=500
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
