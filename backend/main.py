from fastapi import FastAPI, Request, HTTPException, Query, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import pandas as pd
import numpy as np
import uvicorn
import joblib
import json
import stripe
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client, Client
import os
from routes.analisis_link import router as analisis_router
from routes.getPisos import router as pisos_router
from routes.getZonas import router as zonas_router
from routes.getPriceEstimation import router as price_estimation_router
from routes.getZona import router as zona_router
from typing import List

from deps.dependencies import (
    get_supabase,
    get_model_precio,
    get_model_precio_m2,
    get_features_precio_m2,
    get_features_precio,
    get_gemini_model,
    get_df,
    get_stripe,
    get_stripe_endpoint_secret,
    get_df_zonas
)

# ========== INICIALIZACIÓN FASTAPI ==========
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analisis_router)
app.include_router(pisos_router)
app.include_router(zonas_router)
app.include_router(price_estimation_router)
app.include_router(zona_router)

# ========== DEPENDENCIES ==========
supabase = get_supabase()
model_precio = get_model_precio()
model_precio_m2 = get_model_precio_m2()
features_precio = get_features_precio()
features_precio_m2 = get_features_precio_m2()
model = get_gemini_model()
df = get_df()
df_zonas = get_df_zonas()
stripe = get_stripe()
endpoint_secret = get_stripe_endpoint_secret()

# ========== ENDPOINTS ==========
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

mapa_zona_id = dict(zip(df_zonas["nombre"], df_zonas["id"]))
@app.get("/precio_m2_zonas")
def precio_m2_por_zonas(zonas: List[str] = Query(...)):
    resultado = {}

    for nombre in zonas:
        zona_id = mapa_zona_id.get(nombre)

        if zona_id is None:
            resultado[nombre] = {
                "error": "Zona no encontrada"
            }
            continue

        precios = df.loc[df["zona_id"] == zona_id, "precio_m2"]

        if precios.empty:
            resultado[nombre] = {
                "zona_id": int(zona_id),
                "precio_m2_medio": None,
                "n_pisos": 0
            }
            continue

        resultado[nombre] = {
            "zona_id": int(zona_id),
            "precio_m2_medio": round(precios.mean(), 2),
            "n_pisos": len(precios)
        }

    return JSONResponse(content=resultado)

@app.post("/sugerencias")
async def sugerencias(data: Request):
    input_data = await data.json()
    df_input = pd.DataFrame([input_data])
    for col in ["habitaciones", "baños", "metros", "precio_estimado"]:
        df_input[col] = pd.to_numeric(df_input[col], errors="coerce")
    
    precio_estimado = input_data.get("precio_estimado")
    margen = 0.50

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

    # Calculate time on market and new listings per month if date columns exist
    has_dates = "fecha_publicacion" in df.columns
    
    if has_dates:
        # Convert to datetime
        df["fecha_publicacion"] = pd.to_datetime(df["fecha_publicacion"], errors='coerce')
        
        # Calculate days on market
        df["dias_mercado"] = (datetime.now() - df["fecha_publicacion"]).dt.days
        
        # Calculate new listings per month (last 30 days)
        current_date = datetime.now()
        thirty_days_ago = current_date - pd.Timedelta(days=30)
        df["es_nuevo"] = df["fecha_publicacion"] >= thirty_days_ago

    # Group data by vendor with additional metrics
    agg_dict = {
        "id": "count",
        "precio": ["mean", "min", "max"],
        "metros": "mean",
        "tipo": lambda x: x.value_counts().to_dict(),
        "zona": lambda x: x.value_counts().to_dict(),
    }
    
    # Add time-based metrics if available
    if has_dates:
        agg_dict["dias_mercado"] = "mean"
        agg_dict["es_nuevo"] = "sum"
    
    vendedores = df.groupby("anunciante").agg(agg_dict).reset_index()

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
    base_columns = [
        "nombre",
        "total_propiedades",
        "precio_medio", 
        "precio_min",
        "precio_max",
        "metros_medio",
        "tipos",
        "zonas"
    ]
    
    # Add time-based columns if available
    if has_dates:
        base_columns.extend(["tiempo_medio_mercado", "nuevos_al_mes"])
    
    vendedores.columns = base_columns

    # Round numeric values
    vendedores["precio_medio"] = vendedores["precio_medio"].round(2)
    vendedores["precio_min"] = vendedores["precio_min"].round(2)
    vendedores["precio_max"] = vendedores["precio_max"].round(2)
    vendedores["metros_medio"] = vendedores["metros_medio"].round(1)
    
    if has_dates:
        vendedores["tiempo_medio_mercado"] = vendedores["tiempo_medio_mercado"].round(0)
        # Ensure nuevos_al_mes is an integer
        vendedores["nuevos_al_mes"] = vendedores["nuevos_al_mes"].fillna(0).astype(int)

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

    # Convert .value_counts() dicts to native types
    tipos = {str(k): int(v) for k, v in vendedor_df["tipo"].value_counts().to_dict().items()}
    zonas = {str(k): int(v) for k, v in vendedor_df["zona"].value_counts().to_dict().items()}

    # Calculate time on market and new listings per month if date columns exist
    tiempo_medio_mercado = None
    nuevos_al_mes = 0
    promedio_mensual_6meses = None
    if "fecha_publicacion" in vendedor_df.columns:
        # Convert to datetime
        vendedor_df["fecha_publicacion"] = pd.to_datetime(vendedor_df["fecha_publicacion"], errors='coerce')
        
        # Filter out rows with invalid dates
        valid_dates = vendedor_df[vendedor_df["fecha_publicacion"].notnull()]
        
        if not valid_dates.empty:
            # Calculate days on market
            valid_dates["dias_mercado"] = (datetime.now() - valid_dates["fecha_publicacion"]).dt.days
            tiempo_medio_mercado = round(float(valid_dates["dias_mercado"].mean()), 0)
            
            # Calculate new listings per month (last 30 days)
            current_date = datetime.now()
            thirty_days_ago = current_date - pd.Timedelta(days=30)
            nuevos_al_mes = int(sum(valid_dates["fecha_publicacion"] >= thirty_days_ago))
            print(nuevos_al_mes)

            # Calculate new listings per month (last 6 days)
            six_months_ago = current_date - pd.Timedelta(days=180)
            recent_properties = valid_dates[valid_dates["fecha_publicacion"] >= six_months_ago]
            if not recent_properties.empty:
                # Group by month and count
                monthly_counts = recent_properties.groupby(recent_properties["fecha_publicacion"].dt.to_period("M")).size()
                
                # Calculate average (if we have data for at least one month)
                if len(monthly_counts) > 0:
                    promedio_mensual_6meses = round(float(monthly_counts.mean()), 1)

    # Calculate price per m²
    precio_m2_medio = round(float(vendedor_df["precio"].sum() / vendedor_df["metros"].sum()), 2)

    # Convert properties to clean list
    propiedades = vendedor_df[[
        'id', 'tipo', 'zona', 'precio', 'metros',
        'habitaciones', 'baños', 'categoria_valor'
    ]].applymap(lambda x: x.item() if isinstance(x, (np.integer, np.floating)) else x).to_dict(orient="records")

    stats = {
        "nombre": nombre,
        "total_propiedades": int(len(vendedor_df)),
        "precio_medio": round(float(vendedor_df["precio"].mean()), 2),
        "precio_min": round(float(vendedor_df["precio"].min()), 2),
        "precio_max": round(float(vendedor_df["precio"].max()), 2),
        "metros_medio": round(float(vendedor_df["metros"].mean()), 1),
        "precio_m2_medio": precio_m2_medio,
        "tiempo_medio_mercado": tiempo_medio_mercado,
        "nuevos_al_mes": nuevos_al_mes,
        "promedio_mensual_6meses": promedio_mensual_6meses,
        "tipos": tipos,
        "zonas": zonas,
        "propiedades": propiedades
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

@app.get("/analiza_agencia")
def analiza_agencia(user_id: str = Query(...)):
    # Obtener ID de la agencia asociada al id de agencia en el profile

    #agencia = supabase.table("agencias").select("*").eq("user_id", user_id).single().execute().data
    agencia = (supabase.table("profiles").select("agencias(*)").eq("id", user_id).single().execute().data["agencias"])
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
    Sé claro, directo y objetivo. No inventes información que no esté en el texto original.
    """
    try:
        respuesta = model.generate_content(prompt)
        texto = respuesta.text
        return texto
    except Exception as e:
        print(f"Error al generar valoración con Gemini: {e}")
        return '{"valoracion_titulo": 5, "valoracion_descripcion": 5, "titulo_mejorado": "", "mejoras_descripcion": []}'

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

@app.post("/createProfile")
def create_profile(data: dict):
    print(data)
    supabase.table("profiles").insert({
        "id": data["id"],
        "nombre": data["nombre"],
        "estado": data.get("estado", "activo")
    }).execute()
    return {"ok": True}

# create another route that updates the profile
@app.post("/updateProfile")
def update_profile(data: dict):
    supabase.table("profiles").update({
        "agencia_id": data["agencia_id"],
        "estado": data.get("estado", "activo")
    }).eq("id", data["id"]).execute()
    return {"ok": True}

# create another route that updates the profile
@app.post("/updateProfilePlan")
def update_profile_plan(data: dict):
    supabase.table("profiles").update({
        "plan": data["plan"],
    }).eq("id", data["id"]).execute()
    return {"ok": True}

# ----------------------------- STRIPE ----------------------------- #
@app.post("/create-checkout-session")
async def create_checkout_session(request: Request):
    data = await request.json()
    print("DATA:",data)
    price_ids = {
        'basic': 'price_1RLRjoPJNoIjbZAWslwvJsjn',    # Replace with your actual Stripe price ID
        'pro': 'price_1RLRjzPJNoIjbZAWcAjwbZ33',      # Replace with your actual Stripe price ID
        'premium': 'price_3OvXXXXXXXXXXXXX'   # Replace with your actual Stripe price ID
    }

    plan = data.get('plan')
    price_id = price_ids.get(plan)
    userId = data.get('userId')
    session = stripe.checkout.Session.create(
        customer_email=data.get('email'),
        line_items=[{
            "price": price_id,
            "quantity": 1,
        }],
        metadata={
            "user_id": userId,
            "plan": plan
        },
        subscription_data={
            "metadata": {
                "user_id": userId,
                "plan": plan,
            }
        },
        mode="subscription",
        success_url="http://localhost:5173/success",
        cancel_url="http://localhost:5173/cancel",
    )
    return {"url": session.url}

@app.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    print("WEBHOOK")
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Maneja evento de pago completado
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']
        plan = session['metadata']['plan']

        # Actualiza tabla profiles
        supabase.table("profiles").update({
            "stripe_id": session['customer'],
            "estado": "pagado",
            "plan": plan
        }).eq("id", user_id).execute()
        print(f"✅ Updated user {user_id} to plan '{plan}'")
    elif event['type'] in ['checkout.session.expired', 'invoice.payment_failed', 'payment_intent.payment_failed', 'charge.failed','customer.subscription.deleted']:
        # Buscas por user_id si lo tienes, o por email si es un fallback
        print(f"❌ Payment failed or cancelled for user")
    return {"received": True}

# ========== IMPORTS ========== #
from supabase_querys import get_agencia_from_profile, get_profile_from_user_id
from auth import get_current_user
@app.get("/get_profile_agency")
def get_profile_agencia(user_id: str = Query(...), user=Depends(get_current_user)):
    agencia = get_agencia_from_profile(user_id)
    if agencia:
        return agencia
    else:
        return {"error": "No se encontró la agencia para el usuario especificado"}, 404

# get profile from user_id
@app.get("/get_profile")
def get_profile(user_id: str = Query(...), user=Depends(get_current_user)):
    profile = get_profile_from_user_id(user_id)
    if profile:
        return profile
    else:
        return {"error": "No se encontró el perfil para el usuario especificado"}, 404


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
