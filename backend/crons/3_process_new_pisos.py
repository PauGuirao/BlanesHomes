import requests
from bs4 import BeautifulSoup as bs
import random
import time
import pandas as pd
import numpy as np
import time
import re
import datetime
from sklearn.impute import SimpleImputer
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# ======== CONFIGURACIÓN ========
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

año_actual = datetime.datetime.now().year

def preprocess_real_estate_data_for_training(ruta_csv,city):
    # Leer CSV
    df = pd.read_csv(ruta_csv)

    # Convertir booleanos a 0/1
    booleanas = ['terraza', 'balcón', 'garaje', 'ascensor', 'jardin', 
                 'piscina', 'aire_acondicionado', 'ocupado', 'habitable', 'reforma']
    for col in booleanas:
        if col in df.columns:
            df[col] = df[col].astype(int)

    # Reemplazar 0 en año_construcción por NaN y aplicar imputación
    if 'año_construccion' in df.columns:
        df['año_construccion'] = df['año_construccion'].replace(0, np.nan)
        imputer = SimpleImputer(strategy='median')
        df['año_construccion'] = imputer.fit_transform(df[['año_construccion']])

    # Procesar fecha de publicación
    if 'fecha_publicacion' in df.columns:
        df['fecha_publicacion'] = pd.to_datetime(df['fecha_publicacion'], format="%d-%m-%Y", errors='coerce')
        df['publicacion_mes'] = df['fecha_publicacion'].dt.month
        df['publicacion_dia_semana'] = df['fecha_publicacion'].dt.weekday
        df['antiguedad_dias'] = (datetime.datetime.now() - df['fecha_publicacion']).dt.days

    # One-hot encoding para zona y tipo
    for col in ['zona', 'tipo']:
        if col in df.columns:
            df = pd.get_dummies(df, columns=[col], prefix=col)

    # calcular precio por m²
    if 'precio' in df.columns and 'metros' in df.columns:
        df['precio_m2'] = df['precio'] / df['metros'].replace(0, np.nan)
    
    # calcular ratio habitaciones/baños
    if 'habitaciones' in df.columns and 'baños' in df.columns:
        df['ratio_habitaciones_baños'] = df['habitaciones'] / df['baños'].replace(0, np.nan)
    # calcular los extras
    extras = ['terraza', 'balcon', 'garaje', 'ascensor', 'jardin', 
              'piscina', 'aire_acondicionado']
    df['n_extras'] = df[extras].sum(axis=1)

    # ✅ Convertir columnas booleanas a 0/1 después del one-hot
    df = df.astype({col: int for col in df.select_dtypes('bool').columns})

    # reconstruyo el atributo zona
    zona_columns = [col for col in df.columns if col.startswith('zona_')]
    df['zona'] = df[zona_columns].idxmax(axis=1).str.replace('zona_', '')

    # reconstruyo el atributo tipo
    tipo_columns = [col for col in df.columns if col.startswith('tipo_')]
    df['tipo'] = df[tipo_columns].idxmax(axis=1).str.replace('tipo_', '')

    # change the atribute name id by url_id
    df.rename(columns={'id': 'url_id'}, inplace=True)

    # --------------------- NUEVO ------------------------ #

    zonas_res = supabase.table("zonas").select("id", "nombre", "ciudad").execute()
    tipos_res = supabase.table("tipos").select("id", "nombre").execute()

    zonas_df = pd.DataFrame(zonas_res.data)
    tipos_df = pd.DataFrame(tipos_res.data)

    # Unir por nombre de zona y ciudad
    df = df.merge(zonas_df, how="left", left_on=["zona", "city"], right_on=["nombre", "ciudad"])
    df = df.rename(columns={"id": "zona_id"})
    df = df.drop(columns=["nombre", "ciudad"])

    # Unir por tipo
    df = df.merge(tipos_df, how="left", left_on="tipo", right_on="nombre")
    df = df.rename(columns={"id": "tipo_id"})
    df = df.drop(columns=["nombre"])
    # ------------------------------------------------------ #

    # Crear los centroides por zona (una vez)
    coordenadas_por_zona = df.groupby('zona')[['latitud', 'longitud']].mean().to_dict('index')

    # Luego para cada fila faltante
    for i, row in df[df['latitud'].isna()].iterrows():
        zona = row['zona']
        if zona in coordenadas_por_zona:
            df.at[i, 'latitud'] = coordenadas_por_zona[zona]['latitud']
            df.at[i, 'longitud'] = coordenadas_por_zona[zona]['longitud']
    


    # Save to processedFiles directory
    processed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backend/data', 'processedFiles')
    os.makedirs(processed_dir, exist_ok=True)
    current_datetime = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(processed_dir, f'{city}_data_NEW_{current_datetime}.csv')
    df.to_csv(output_file, index=False)
    return df

def generate_description_training_data(input_file):
    """Generate description training data directly from input CSV file"""
    # Read CSV
    df = pd.read_csv(input_file)
    
    def generate_property_description(row):
        extras = []
        for campo in ['terraza', 'garaje', 'ascensor', 'jardin', 'piscina', 'aire_acondicionado']:
            if row[campo] == True:
                extras.append(campo.replace('_', ' '))
        extras_texto = ", " + ", ".join(extras) if extras else ""

        return (
            f"{row['tipo']} de {row['metros']} m² en {row['zona']} con "
            f"{row['habitaciones']} habitaciones, {row['baños']} baños{extras_texto}"
        )

    # Generate input and target texts
    df_descriptions = pd.DataFrame({
        'input_text': df.apply(generate_property_description, axis=1),
        'target_text': df['descripcion']
    })

    # Save to processedFiles_Descriptions directory
    descriptions_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backend/data', 'processedFiles_Descriptions')
    os.makedirs(descriptions_dir, exist_ok=True)
    current_datetime = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(descriptions_dir, f'lloret_descriptions_{current_datetime}.csv')
    df_descriptions.to_csv(output_file, index=False)
    return df_descriptions

if __name__ == "__main__":
    # Define the city to process (can be made a command-line argument)
    city = "lloret-de-mar-girona"
    
    # Get the latest file from scrappedFiles directory for the specified city
    scrapped_dir = '../data/scrappedFiles'
    city_pattern = f"{city}_scrapped_"
    
    # Filter files by city pattern and ensure they're CSV files
    files = [f for f in os.listdir(scrapped_dir) 
             if f.startswith(city_pattern) and f.endswith('.csv')]
    
    if not files:
        print(f"No CSV files found for city: {city}")
        exit(1)
    
    # Get the most recent file based on creation time
    latest_file = max(files, key=lambda x: os.path.getctime(os.path.join(scrapped_dir, x)))
    input_file = os.path.join(scrapped_dir, latest_file)
    
    print(f"Processing latest file for {city}: {latest_file}")

    # Update output filenames to include city name
    # Crear archivo CSV procesado para entrenar el modelo XGBoost (price predicting)
    processed_df = preprocess_real_estate_data_for_training(input_file,city)
    
    # Crear archivo CSV procesado para entrenar el modelo mt5-small (description generating)
    generate_description_training_data(input_file)