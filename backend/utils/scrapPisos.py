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
import random

año_actual = datetime.datetime.now().year

proxies = [
    "43.153.103.91:13001",
    "49.51.229.252:13001",
    "43.152.72.76:13001",
    "43.153.121.25:13001",
    "43.153.75.63:13001",
    "43.153.25.42:13001",
    "43.153.69.199:13001"
]

# Lista de User-Agents comunes
user_agents = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
]

def main():
    # iterate over the file ids.txt
    with open('ids.txt', 'r') as f:
        ids = f.readlines()
    ids = [x.strip() for x in ids]

    # iterate over the ids
    for id_piso in ids:
        # scrap the id
        df = scrap_inmueble(id_piso)
        if df is not None and not df.empty:
            # save the dataframe to a csv file or append to the csv file if it exists
            try:
                df.to_csv('idealista_test.csv', mode='a', header=False, index=False)
            except FileNotFoundError:
                df.to_csv('idealista_test.csv', mode='w', header=True, index=False)
            time.sleep(random.randint(1, 3))
        else:
            print(f"[ID {id_piso}] ⚠️ No se guardó (vacío o error).")

def scrap_inmueble(id_piso):
    #random proxies and user agents
    #proxy = random.choice(proxies)
    proxy = '43.153.103.91:13001'
    user_agent = random.choice(user_agents)

    options = uc.ChromeOptions()

    options.add_argument(f"--proxy-server=http://{proxy}")
    #options.add_argument(f"user-agent={user_agent}")

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
    #close window
    browser.quit()
    # Extracting the Data

    #title
    title_tag = soup.find('span', class_='main-info__title-main')
    if title_tag is None:
        return None
    title = title_tag.text.strip()

    # type
    title_lower = title.lower()
    if "piso" in title_lower:
        tipo = "piso"
    elif "chalet" in title_lower:
        tipo = "casa"
    elif "casa" in title_lower:
        tipo = "casa"
    elif "estudio" in title_lower:
        tipo = "estudio"
    elif "ático" in title_lower or "dúplex" in title_lower:
        tipo = "piso"
    else:
        tipo = "otro"


    #price
    price = int(soup.find('span', class_='info-data-price').text.strip().replace('€','').replace('.','').replace(',','.'))

    #metrage
    metrage_text = None  # valor por defecto si no se encuentra

    info_features = soup.find('div', class_='info-features')

    if info_features:
        spans = info_features.find_all('span')
        for span in spans:
            texto = span.text.strip()
            if 'm²' in texto or 'm2' in texto:
                try:
                    metrage_text = int(float(
                        texto.replace('m²', '')
                            .replace('m2', '')
                            .replace('.', '')
                            .replace(',', '.')
                            .strip()
                    ))
                except ValueError:
                    metrage_text = None
                break  # ya lo tenemos


    #habitaciones
    habitaciones = 0
    for span in spans:
        texto = span.text.strip()
        if 'hab.' in texto:
            valor = texto.replace('hab.', '').strip()
            if valor.isdigit():
                habitaciones = int(valor)
            break

    #zona
    zona = soup.find('span', class_='main-info__title-minor').text.strip().split(',')[0]
    # SI LA ZONA NO EXISTE, ASIGNAR 'OTRA ZONA'
    if not zona:
        zona = 'otra zona' 
    # Buscar el div con ID headerMap
    ubicacion_div = soup.find('div', id='headerMap')

    # fecha publicacion
    fecha_publicacion = extraer_fecha_anuncio(soup)
    # Buscar todos los <li> con clase header-map-list
    ubicacion_items = ubicacion_div.find_all('li', class_='header-map-list') if ubicacion_div else []

    # Obtener la primera entrada como la calle
    calle = ubicacion_items[0].get_text(strip=True) if ubicacion_items else None
    if 'Distrito' in calle:
        calle = calle.replace('Distrito', '').strip()
    if zona == 'Blanes':
        zona = calle
        # Elimina 'Distrito' y los espacios
        if 'Distrito' in zona:
            zona = zona.replace('Distrito', '').strip()
    calle = procesar_calle(calle)
    #extraer latitud y longitud
    lat, lon = get_lat_lon(calle)
    print(f"Latitude: {lat} & Longitude: {lon}")
    # Si la zona es 'Blanes' zona es igual a la calle
    # Buscar el contenedor de características básicas
    caracteristicas_div = soup.find('div', class_='details-property-feature-one')

    # coje la descripción y busca si esta ocupado  y es habitable
    descripcion_div = soup.find('div', class_='comment')
    descripcion = descripcion_div.get_text(strip=True).lower() if descripcion_div else ''
    if 'ocupado' in descripcion.lower():
        ocupado = True
    elif 'ocupada' in descripcion.lower():
        ocupado = True
    else:
        ocupado = False
        
    if 'cédula de habitabilidad' in descripcion.lower():
        habitable = False
    else:
        habitable = True

    
    # Obtener todos los elementos de lista
    caracteristicas_items = caracteristicas_div.find_all('li')

    # Get advertiser name
    advertiser_tag = soup.find('a', class_='about-advertiser-name')
    advertiser = advertiser_tag.text.strip() if advertiser_tag else None

    # Get full description
    descripcion_div = soup.find('div', class_='comment')
    descripcion_completa = descripcion_div.find('p').text.strip() if descripcion_div else None
    
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
        # Garaje
        elif 'garaje' in texto.lower():
            atributos['garaje'] = True
        # Ascensor
        elif 'ascensor' in texto.lower() or 'Ascensor' in texto.lower():
            atributos['ascensor'] = True
        # Sin ascensor
        elif 'Sin ascensor' in texto.lower():
            atributos['ascensor'] = False
         # reforma 
        elif 'Segunda mano/para reformar' in texto.lower():
            atributos['reforma'] = True
        
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
        if 'jardín' in texto.lower() or 'jardin' in texto.lower():
            atributos_equipamiento['jardin'] = True
        elif 'piscina' in texto.lower():
            atributos_equipamiento['piscina'] = True
        elif 'aire acondicionado' in texto.lower():
            atributos_equipamiento['aire_acondicionado'] = True
    

    
    # Create a DataFrame
    data = {
        'title': [title],
        'tipo': [tipo],
        'price': [price],
        'zona': [zona],
        'calle': [calle],
        'latitud': [lat],
        'longitud': [lon],
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
        'habitable': [habitable],
        'reforma': [atributos.get('reforma', False)],
        'fecha_publicacion': [fecha_publicacion],
        'anunciante': [advertiser],
        'descripcion': [descripcion_completa],
    }

    return pd.DataFrame(data)

def extraer_fecha_anuncio(soup):
    stats_text = soup.find('p', class_='stats-text')
    
    if not stats_text:
        return None

    texto = stats_text.get_text(strip=True).lower()
    match = re.search(r'actualizado el (\d{1,2}) de (\w+)', texto)

    if not match:
        return None

    dia = int(match.group(1))
    mes_str = match.group(2)

    meses = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
        'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    }

    mes = meses.get(mes_str)
    if not mes:
        return None

    hoy = datetime.datetime.now()
    año = hoy.year

    # Si el mes del anuncio aún no ha pasado este año, es del año anterior
    if mes > hoy.month:
        año -= 1

    fecha = datetime.datetime(año, mes, dia)
    return fecha.strftime("%d-%m-%Y")

def get_lat_lon(address):
    url = 'https://nominatim.openstreetmap.org/search'

    params = {
        'q': address+', Blanes, Girona',
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'YourAppNameHere'  # Required by Nominatim usage policy
    }
    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    if data:
        lat = data[0]['lat']
        lon = data[0]['lon']

        return float(lat), float(lon)
    else:

        return None, None

def procesar_calle(nombre_calle):
    if not isinstance(nombre_calle, str):
        return nombre_calle

    nombre_calle = nombre_calle.strip().lower()

    # Diccionario de zonas que no son calles → calle representativa
    zona_a_calle = {
        'centre': 'carrer ample',
        'semicentre': 'carrer anselm clavé,62',
        'els pavos': 'carrer provença,4',
        'mas florit': 'carrer de montblanc',
        'ca la guidó': 'carrer joan oliver',
        'la plantera': 'carrer béjar',
        'els pins': 'carrer vila de paris',
        'mont ferrant - sant joan': 'carrer de santa bàrbara, 37-33',
        'cala sant francesc - santa cristina': 'carrer de la cala',
    }

    # Si es una zona conocida, devolver su calle representativa
    if nombre_calle in zona_a_calle:
        return zona_a_calle[nombre_calle]

    # Reemplazo del tipo de vía
    reemplazos = {
        'calle': 'carrer',
        'avenida': 'avinguda',
        'avda': 'avinguda',
        'av.': 'avinguda',
        'paseo': 'passeig',
        'pasaje': 'passatge',
        'plaza': 'plaça',
        'ronda': 'ronda',         # ya correcto
        'carretera': 'carretera'  # ya correcto
    }

    for cast, cat in reemplazos.items():
        if nombre_calle.lower().startswith(cast.lower()):
            nombre_calle = nombre_calle.replace(cast, cat, 1)
            break
    
    # si la direccion no contiene 'carrer' o 'avinguda', añadir 'carrer'
    nombre_calle = nombre_calle.lower()
    tipos_catalan = ['carrer', 'avinguda', 'passeig', 'plaça', 'ronda', 'carretera', 'passatge']
    if not any(t in nombre_calle.lower() for t in tipos_catalan):
        nombre_calle = f'carrer {nombre_calle}'

    return nombre_calle

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
    main()