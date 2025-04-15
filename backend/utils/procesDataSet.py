import requests
from bs4 import BeautifulSoup as bs
import random
import time
import pandas as pd
import numpy as np
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import undetected_chromedriver as uc
import time
import re
import datetime
from sklearn.impute import SimpleImputer

año_actual = datetime.datetime.now().year

def procesar_csv_idealista(ruta_csv):
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


    # transformar a csv
    df.to_csv('idealista_procesado.csv', index=False)
    return df


if __name__ == "__main__":
    procesar_csv_idealista('idealista.csv')