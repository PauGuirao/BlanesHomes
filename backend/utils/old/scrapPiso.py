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

año_actual = datetime.datetime.now().year

def main():
    id_piso = '105540147'  # Replace with the actual ID you want to scrape
    df = scrap_inmueble(id_piso)
    print(df)

def scrap_inmueble(id_piso):
    #proxies
    proxy = '170.106.158.82:13001'

    options = uc.ChromeOptions()

    options.add_argument(f" - proxy-server={proxy}")

    browser = uc.Chrome(
        options=options,
        use_subprocess=False,)

    url = f'https://www.idealista.com/inmueble/{id_piso}/'

    browser.get(url)
    browser.implicitly_wait(10)
    # Accept cookies
    try:
        accept_cookies = browser.find_element("xpath", '//*[@id="didomi-notice-agree-button"]')
        accept_cookies.click()
    except:
        pass
    html = browser.page_source
    soup = bs(html, 'html.parser')

    browser.close()
    # Extracting the Data

    #title
    title = soup.find('span', class_='main-info__title-main').text.strip()

    # type
    title_lower = title.lower()
    if "piso" in title_lower:
        tipo = "piso"
    elif "chalet" in title_lower:
        tipo = "casa"
    elif "casa" in title_lower:
        tipo = "casa"
    else:
        tipo = "otro"

    #price
    price = int(soup.find('span', class_='info-data-price').text.strip().replace('€','').replace('.','').replace(',','.'))

    #metrage
    info_features = soup.find('div', class_='info-features')
    spans = info_features.find_all('span')
    metrage_text = int(spans[0].text.strip().replace('m²', '').replace('m2', '').replace(',', '.').strip())

    #habitaciones
    habitaciones = spans[1].text.strip().replace('hab.', '').strip()
    # si habitaciones no existe, asignar 0
    if not habitaciones:
        habitaciones = 0
    else:
        habitaciones = int(habitaciones)
    #zona
    zona = soup.find('span', class_='main-info__title-minor').text.strip().split(',')[0]
    # SI LA ZONA NO EXISTE, ASIGNAR 'OTRA ZONA'
    if not zona:
        zona = 'otra zona' 
    # Buscar el div con ID headerMap
    ubicacion_div = soup.find('div', id='headerMap')

    # Buscar todos los <li> con clase header-map-list
    ubicacion_items = ubicacion_div.find_all('li', class_='header-map-list') if ubicacion_div else []

    # Obtener la primera entrada como la calle
    calle = ubicacion_items[0].get_text(strip=True) if ubicacion_items else None
    # Si la zona es 'Blanes' zona es igual a la calle
    if zona == 'Blanes':
        zona = calle
    # Buscar el contenedor de características básicas
    caracteristicas_div = soup.find('div', class_='details-property-feature-one')

    # coje la descripción y busca si esta ocupado  
    descripcion_div = soup.find('div', class_='comment')
    descripcion = descripcion_div.get_text(strip=True).lower() if descripcion_div else ''
    if 'ocupado' in descripcion.lower():
        ocupado = True
    else:
        ocupado = False

    # Obtener todos los elementos de lista
    caracteristicas_items = caracteristicas_div.find_all('li')

    # Extraer el texto de cada uno
    caracteristicas = [item.get_text(strip=True) for item in caracteristicas_items]
    atributos = {}
    for texto in caracteristicas:
        # Habitaciones
        if re.search(r'\bhabitaci[oó]n(?:es)?\b', texto):
            atributos['habitaciones'] = int(''.join(filter(str.isdigit, texto)) or 0)
            if atributos['habitaciones'] != habitaciones:
                habitaciones = 0
        # Baños
        elif re.search(r'\bbañ[oa](?:s)?\b', texto):
            atributos['baños'] = int(''.join(filter(str.isdigit, texto)) or 0)
        # Año de construcción
        elif re.search(r'constru[iï]do', texto, re.IGNORECASE):
            # Buscar explícitamente un año válido dentro del texto
            match = re.search(r'\b(18\d{2}|19\d{2}|20\d{2})\b', texto)
            if match:
                año = int(match.group(1))
                if 1800 <= año <= año_actual:
                    atributos['año_construcción'] = año
        # Terraza
        elif 'terraza' in texto.lower():
            atributos['terraza'] = True
        # Balcón
        elif 'balcón' in texto.lower() or 'balcon' in texto.lower():
            atributos['balcón'] = True
        elif 'garaje' in texto.lower():
            atributos['garaje'] = True
        elif 'ascensor' in texto.lower() or 'Ascensor' in texto.lower():
            atributos['ascensor'] = True
        elif 'Sin ascensor' in texto.lower():
            atributos['ascensor'] = False
        
    # si atributos['terraza'] no existe, asignar False
    if 'terraza' not in atributos:
        atributos['terraza'] = False
    # si atributos['balcón'] no existe, asignar False
    if 'balcón' not in atributos:
        atributos['balcón'] = False
    # si atributos['garaje'] no existe, asignar False
    if 'garaje' not in atributos:
        atributos['garaje'] = False

    # Buscar el contenedor de equipamiento/ consumo
    equipamiento_div = soup.find('div', class_='details-property-feature-two')
    equipamiento_items = equipamiento_div.find_all('li') if equipamiento_div else []
    equipamiento = [item.get_text(strip=True) for item in equipamiento_items]
    atributos_equipamiento = {}
    for texto in equipamiento:
        # Habitaciones
        if 'Jardín' in texto.lower() or 'jardín' in texto.lower() or 'Jardin' in texto.lower():
            atributos_equipamiento['jardin'] = True
        elif 'Piscina' in texto.lower() or 'piscina' in texto.lower():
            atributos_equipamiento['piscina'] = True
        elif 'Aire acondicionado' in texto.lower():
            atributos_equipamiento['aire_acondicionado'] = True
    

    
    # Create a DataFrame
    data = {
        'title': [title],
        'tipo': [tipo],
        'price': [price],
        'zona': [zona],
        'calle': [calle],
        'metrage': [metrage_text],
        'habitaciones': [habitaciones],
        'baños': [atributos['baños']],
        'año_construcción': [atributos.get('año_construcción', 0)],
        'terraza': [atributos['terraza']],
        'balcón': [atributos['balcón']],
        'garaje': [atributos.get('garaje', False)],
        'ascensor': [atributos.get('ascensor', False)],
        'jardin': [atributos_equipamiento.get('jardin', False)],
        'piscina': [atributos_equipamiento.get('piscina', False)],
        'aire_acondicionado': [atributos_equipamiento.get('aire_acondicionado', False)],
        'ocupado': [ocupado],
    }

    return pd.DataFrame(data)


if __name__ == "__main__":
    main()