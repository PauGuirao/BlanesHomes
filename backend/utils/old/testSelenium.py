# ------------ Imports ------------ #
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.webdriver import WebDriver
import undetected_chromedriver as uc
import time
import zipfile
import os
import re
import datetime
import random
from bs4 import BeautifulSoup as bs
import pandas as pd
import numpy as np
import requests

# ------------ Variables ------------ #
OXY_USER = "pgc02_BlDXu"
OXY_PASS = "XVz33uC+5"
PROXY_PORTS = [8001, 8002, 8003, 8004, 8005]
BATCH_SIZE = 5

save_dir = '../data/scrappedFiles'
os.makedirs(save_dir, exist_ok=True)
current_datetime = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
filename = os.path.join(save_dir, f'blanes_scrapped_{current_datetime}.csv')
año_actual = datetime.datetime.now().year

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

def create_proxy_auth_extension(proxy_host, proxy_port, proxy_user, proxy_pass, scheme='http', plugin_path=None):
    manifest_json = """
    {
        "version": "1.0.0",
        "manifest_version": 2,
        "name": "Proxy Auth Extension",
        "permissions": [
            "proxy",
            "tabs",
            "unlimitedStorage",
            "storage",
            "<all_urls>",
            "webRequest",
            "webRequestBlocking"
        ],
        "background": {
            "scripts": ["background.js"]
        }
    }
    """
    background_js = f'''
    var config = {{
        mode: "fixed_servers",
        rules: {{
            singleProxy: {{
                scheme: "{scheme}",
                host: "{proxy_host}",
                port: parseInt({proxy_port})
            }},
            bypassList: ["localhost"]
        }}
    }};

    chrome.proxy.settings.set({{value: config, scope: "regular"}}, function() {{}});

    chrome.webRequest.onAuthRequired.addListener(
        function(details, callbackFn) {{
            callbackFn({{
                authCredentials: {{
                    username: "{proxy_user}",
                    password: "{proxy_pass}"
                }}
            }});
        }},
        {{urls: ["<all_urls>"]}},
        ['blocking']
    );
    '''

    if plugin_path is None:
        plugin_path = os.path.join(os.getcwd(), 'proxy_auth_plugin.zip')

    with zipfile.ZipFile(plugin_path, 'w') as zp:
        zp.writestr("manifest.json", manifest_json)
        zp.writestr("background.js", background_js)

    return plugin_path

def init_driver_with_oxylabs(proxy_user, proxy_pass, proxy_host="dc.oxylabs.io", proxy_port=None) -> WebDriver:
    if proxy_port is None:
        proxy_port = random.choice([8001, 8002, 8003, 8004, 8005])  # elige aleatoriamente un puerto
    plugin = create_proxy_auth_extension(
        proxy_host=proxy_host,
        proxy_port=proxy_port,
        proxy_user=proxy_user,
        proxy_pass=proxy_pass,
    )

    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-gpu")
    options.add_extension(plugin)

    driver = uc.Chrome(options=options)
    # 🛡️ Anti-detención manual con CDP
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": """
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
            window.navigator.chrome = { runtime: {} }
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] })
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
        """
    })
    return driver

def scrap_idealista_property(url: str, driver: WebDriver) -> dict:
    try:
        time.sleep(random.randint(6, 8))  # Espera para cargar completamente la página
        # Accept cookies
        try:
            accept_cookies = driver.find_element("xpath", '//*[@id="didomi-notice-agree-button"]')
            accept_cookies.click()
            time.sleep(1)
        except:
            pass
        html = driver.page_source
        soup = bs(html, 'html.parser')

        # ------------ Extracción de datos ------------ #
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
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return {"url": url, "error": str(e)}

if __name__ == "__main__":

    # Read the ids from the file
    with open('../data/idFiles/ids_20250416_132418.txt', 'r') as f:
        ids = f.readlines()
    # Remove any whitespace characters
    ids = [x.strip() for x in ids]

    # Group IDs in batches
    batches = [ids[i:i + BATCH_SIZE] for i in range(0, len(ids), BATCH_SIZE)]

    for i, batch in enumerate(batches):
        port = random.choice(PROXY_PORTS)
        print(f"\n🔄 Opening new browser (Batch {i + 1}) on port {port}")
        driver = init_driver_with_oxylabs(OXY_USER, OXY_PASS, proxy_port=port)
        # iterate over the ids
        for id_piso in batch:
            url = f'https://www.idealista.com/inmueble/{id_piso}/'
            print(f"🔍 Scraping {url}")

            # Simulación de scroll antes de scrapear (comportamiento más humano)
            try:
                driver.get(url)
                time.sleep(random.uniform(3.5, 5))  # tiempo base
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(random.uniform(1.5, 2.5))  # espera tras scroll
                html = driver.page_source
            except Exception as e:
                print(f"❌ Error al cargar página con scroll: {e}")
                continue

            df = scrap_idealista_property(url, driver)

            if df is not None and not df.empty:
                try:
                    df.to_csv(filename, mode='a', header=not os.path.exists(filename), index=False)
                except Exception as e:
                    print(f"❌ Error saving {id_piso}: {e}")
            else:
                print(f"[ID {id_piso}] ⚠️ No se guardó (vacío o error).")

            # Espera entre propiedades: aleatoria y con probabilidad de espera larga
            base_sleep = random.randint(2, 5)
            if random.random() < 0.2:
                extra_sleep = random.randint(8, 15)
                print(f"😴 Espera prolongada: {extra_sleep}s")
                time.sleep(extra_sleep)
            else:
                time.sleep(base_sleep)

        print("🧹 Closing browser...")
        try:
            driver.quit()
            sleep_between_batches = random.randint(5, 12)
            print(f"😴 Sleeping {sleep_between_batches}s before next batch...")
            time.sleep(sleep_between_batches)
        except:
            pass
