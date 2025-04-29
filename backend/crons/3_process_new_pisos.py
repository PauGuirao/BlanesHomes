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

año_actual = datetime.datetime.now().year

def preprocess_real_estate_data_for_training(ruta_csv):
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


    # Crear los centroides por zona (una vez)
    coordenadas_por_zona = df.groupby('zona')[['latitud', 'longitud']].mean().to_dict('index')

    # Luego para cada fila faltante
    for i, row in df[df['latitud'].isna()].iterrows():
        zona = row['zona']
        if zona in coordenadas_por_zona:
            df.at[i, 'latitud'] = coordenadas_por_zona[zona]['latitud']
            df.at[i, 'longitud'] = coordenadas_por_zona[zona]['longitud']
    
    # change the atribute name id by url_id
    df.rename(columns={'id': 'url_id'}, inplace=True)


    # Save to processedFiles directory
    processed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backend/data', 'processedFiles')
    os.makedirs(processed_dir, exist_ok=True)
    current_datetime = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(processed_dir, f'blanes_data_{current_datetime}.csv')
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
    output_file = os.path.join(descriptions_dir, f'blanes_descriptions_{current_datetime}.csv')
    df_descriptions.to_csv(output_file, index=False)
    return df_descriptions

if __name__ == "__main__":
    # Get the latest file from scrappedFiles directory
    scrapped_dir = '../data/scrappedFiles'
    files = [f for f in os.listdir(scrapped_dir) if f.endswith('.csv')]
    latest_file = max(files, key=lambda x: os.path.getctime(os.path.join(scrapped_dir, x)))
    input_file = os.path.join(scrapped_dir, latest_file)

    # Crear archivo CSV procesado para entrenar el modelo  XGBoost (price predicting)
    preprocess_real_estate_data_for_training(input_file)
    
    # Crear archivo CSV procesado para entrenar el modelo mt5-small (description generating)
    generate_description_training_data(input_file)