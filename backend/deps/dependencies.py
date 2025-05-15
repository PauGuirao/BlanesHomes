# deps/dependencies.py

from fastapi import FastAPI, Request, HTTPException, Query, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import pandas as pd
import numpy as np
import joblib
import json
import os
from dotenv import load_dotenv
load_dotenv()

#------------------- SUPABASE ---------------------#
from supabase import create_client, Client
#------------------- GOOGLE ---------------------#
import google.generativeai as genai
#------------------- STRIPE ---------------------#
import stripe

#------------------- MODELOS ---------------------#
model_precio = joblib.load("models/modelo_xgboost_precio.pkl")
features_precio = joblib.load("models/features_xgboost_precio.pkl")  # columnas del modelo
model_precio_m2 = joblib.load("models/modelo_precio_m2.pkl")
features_precio_m2 = joblib.load("models/features_precio_m2.pkl")  # columnas del modelo

#------------------- SUPABASE ---------------------#
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

#------------------- GOOGLE ---------------------#
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

#------------------- STRIPE ---------------------#
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

#------------------- DATAFRAME ---------------------#
response = supabase.table("pisos").select("*", "tipos(nombre)", "zonas(nombre)").not_.is_("descripcion", None).execute()
response_zona = supabase.table("zonas").select("*").not_.is_("poligon", None).execute()
records = response.data
records_zona = response_zona.data

# Convertir a DataFrame
df = pd.DataFrame(records)
df_zonas = pd.DataFrame(records_zona)

# Extraer nombre del tipo y zona
df["tipo"] = df["tipos"].apply(lambda x: x["nombre"] if isinstance(x, dict) else None)
df["zona"] = df["zonas"].apply(lambda x: x["nombre"] if isinstance(x, dict) else None)
df.drop(columns=["tipos", "zonas"], inplace=True)

drop_cols = [
    'url_id', 'id', 'titulo', 'descripcion', 'calle', 'fecha_publicacion',
    'url', 'anunciante', 'city', 'agencia_id', 'activo', 'tipo_id', 'zona_id'
]

df.reset_index(inplace=True)
df.rename(columns={"index": "id"}, inplace=True)

# Crear dummies sin eliminar 'tipo'
tipo_dummies = pd.get_dummies(df['tipo'], prefix='tipo')
df = pd.concat([df, tipo_dummies], axis=1)

# ========== AJUSTE DE COLUMNAS PARA EL MODELO ==========
# Esta lista deberías guardarla en disco cuando entrenes el modelo (como .pkl o .json)
expected_model_columns = model_precio.feature_names_in_.tolist()  # si usaste sklearn 1.0+

# Agrega columnas faltantes (esperadas por el modelo pero ausentes en este df)
for col in expected_model_columns:
    if col not in df.columns:
        df[col] = 0  # rellena con ceros

# Asegura el orden correcto
X = df[expected_model_columns]

# ========== PREDICCIÓN Y CATEGORIZACIÓN ==========
df['precio_estimado'] = model_precio.predict(X)
df['categoria_valor'] = df.apply(lambda row: (
    'ganga' if row['precio'] < row['precio_estimado'] * 0.9 else
    'caro' if row['precio'] > row['precio_estimado'] * 1.1 else
    'justo'
), axis=1)
df['valoracion_score'] = ((df['precio'] - df['precio_estimado']) / df['precio_estimado'])



def get_df():
    return df
    
def get_df_zonas():
    return df_zonas

def get_features_precio():
    return features_precio

def get_features_precio_m2():
    return features_precio_m2

def get_model_precio():
    return model_precio

def get_model_precio_m2():
    return model_precio_m2

def get_supabase():
    return supabase

def get_gemini_model():
    return model

def get_stripe():
    return stripe

def get_stripe_endpoint_secret():
    return endpoint_secret