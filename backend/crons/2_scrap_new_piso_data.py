import nodriver as uc
import asyncio
import os
import json
import logging
import random # Necesario para la espera aleatoria
import re     # Necesario para las características detalladas
import time
import datetime
import requests
from nodriver.core.connection import ProtocolException
import pandas as pd
import numpy as np

from supabase import create_client
from dotenv import load_dotenv
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Configuración ---
# Tiempo de espera máximo para encontrar elementos (ahora definido dentro de la función)
# FIND_TIMEOUT = 10
# Pausa entre peticiones para ser cortés con el servidor (en segundos)
REQUEST_DELAY = 5 # Aumentar ligeramente la pausa puede ser prudente

año_actual = datetime.datetime.now().year

# Configuración básica de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ==============================================================================
# --- PLACEHOLDER FUNCTIONS (Implementar lógica real) ---
# ==============================================================================
async def extraer_fecha_anuncio(tab):
    """
    Extrae la fecha de publicación del anuncio desde un tab de NoDriver.
    Devuelve la fecha en formato dd-mm-YYYY o None si no se puede determinar.
    """
    try:
        stats_el = await tab.query_selector('p.stats-text')
        if not stats_el:
            return None

        print(stats_el)
        texto = stats_el.text_all
        print(texto)
        texto = texto.strip().lower()

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
        if mes > hoy.month:
            año -= 1

        fecha = datetime.datetime(año, mes, dia)
        return fecha.strftime("%d-%m-%Y")

    except Exception as e:
        print(f"⚠️ Error extrayendo la fecha de anuncio: {e}")
        return None

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

# ==============================================================================
# --- FIN PLACEHOLDER FUNCTIONS ---
# ==============================================================================


# ==============================================================================
# --- FUNCIÓN DE SCRAPING REFACTORIZADA ---
# ==============================================================================
async def scrap_idealista_property_nodriver(tab: uc.Tab, url: str, listing_id: str) -> dict:
    """
    Refactorización de scrap_idealista_property usando nodriver.
    Extrae detalles de una propiedad de Idealista.
    Devuelve un diccionario con los datos o un diccionario de error.
    """
    data = {'id': listing_id, 'url': url} # Diccionario base para resultados
    try:
        logging.info(f"Navegando a {url}...")
        await tab.get(url) # Aumentar timeout de navegación si es necesario
        # Espera aleatoria (similar al time.sleep)
        wait_time = random.randint(6, 8)
        logging.info(f"Esperando {wait_time} segundos...")
        await tab.sleep(wait_time)
        time.sleep(wait_time)
        logging.info("Esperando a que se cargue el contenido...")
        # Aceptar cookies (con nodriver)
        try:
            accept_button = await tab.find('#didomi-notice-agree-button')
            if accept_button:
                logging.info("Aceptando cookies...")
                await accept_button.click()
                await tab.sleep(1) # Pequeña pausa tras click
                time.sleep(1)
        except ProtocolException:
            logging.info(f"ID {listing_id}: Botón de cookies no encontrado, continuando.")
        except Exception as e:
            logging.warning(f"ID {listing_id}: Error inesperado al aceptar cookies: {e}")


        # 👇 Añadir scroll simulado con random
        await tab.scroll_down(random.randint(50, 150)) # Ajusta según sea necesario


        # ------------ Extracción de datos usando nodriver ------------ #

        # Title
        try:
            title_element = await tab.find('span.main-info__title-main')
            if not title_element:
                title_element = await tab.find('h1')  # Fallback

            if not title_element:
                logging.warning(f"ID {listing_id}: Título no encontrado. Posiblemente anuncio eliminado.")
                return None  # Skip

            title = title_element.text.strip()
            data['titulo'] = title
        except ProtocolException:
            logging.warning(f"ID {listing_id}: No se pudo acceder al título. El anuncio puede haber sido eliminado.")
            return None
        except Exception as e:
            logging.warning(f"ID {listing_id}: Error inesperado buscando el título: {e}")
            return None

        # Type (derivado del título)
        title_lower = title.lower()
        if "piso" in title_lower: tipo = "piso"
        elif "chalet" in title_lower: tipo = "casa"
        elif "casa" in title_lower: tipo = "casa"
        elif "estudio" in title_lower: tipo = "estudio"
        elif "ático" in title_lower or "dúplex" in title_lower: tipo = "piso"
        else: tipo = "otro"
        data['tipo'] = tipo
        print(f"ID {listing_id}: Tipo extraído: {tipo}")

        # Price
        try:
            price_element = await tab.find('span.info-data-price')
            price_text = price_element.text.strip().replace('€','').replace('.','').replace(',','.')
            data['precio'] = int(float(price_text)) if price_text else None
        except (uc.util.TimeoutError, ValueError, AttributeError) as e:
            logging.warning(f"ID {listing_id}: No se pudo extraer o convertir el precio: {e}")
            data['precio'] = None
        
        print(f"ID {listing_id}: Precio extraído: {data['precio']}")

        # Features (Metrage, Habitaciones) - Buscando en div.info-features
        metrage_text = None
        habitaciones = 0
        try:
            info_features_elements = await tab.find_all('div.info-features span')
            feature_texts = [el.text.strip() for el in info_features_elements if el.text.strip()]
            #data['features_raw'] = feature_texts # Guardamos los textos crudos
            for texto in feature_texts:
                if 'm²' in texto or 'm2' in texto:
                    try:
                        metrage_text = int(float(
                            texto.replace('m²', '').replace('m2', '').replace('.', '').replace(',', '.').strip()
                        ))
                    except ValueError: metrage_text = None
                elif 'hab.' in texto:
                    valor = texto.replace('hab.', '').strip()
                    if valor.isdigit(): habitaciones = int(valor)
        except ProtocolException:
            logging.warning(f"ID {listing_id}: No se encontró la sección 'info-features'.")
        except Exception as e:
            logging.warning(f"ID {listing_id}: Error procesando 'info-features': {e}")

        data['metros'] = metrage_text
        data['habitaciones'] = habitaciones # Valor inicial

        print(f"ID {listing_id}: Metrage extraído: {data['metros']}")
        print(f"ID {listing_id}: Habitaciones extraídas: {data['habitaciones']}")

        # Zona / Calle / Lat/Lon
        zona = None; calle = None; lat = None; lon = None
        try:
            zona_element = await tab.find('span.main-info__title-minor')
            if zona_element:
                 zona = zona_element.text.strip().split(',')[0]
                 if not zona: zona = 'otra zona'

            ubicacion_div = await tab.find('#headerMap')
            if ubicacion_div:
                # show ubicacion_div content
                wait_time = random.randint(1, 3)
                ubicacion_items = await ubicacion_div.query_selector_all('li.header-map-list')
                if ubicacion_items:
                    calle_raw = ubicacion_items[0].text.strip()
                    if 'Distrito' in calle_raw: calle_raw = calle_raw.replace('Distrito', '').strip()
                    # Caso especial Blanes (basado en la ubicación recordada)
                    # OJO: Esto usa la ubicación FIJA de Blanes. Si necesitas que sea dinámico,
                    # hay que cambiar la lógica. Asumiré que Blanes es un caso especial que conoces.
                    current_location_city = "Blanes" # Ajusta si es necesario
                    if zona == current_location_city and calle_raw:
                        zona = calle_raw.replace('Distrito', '').strip() # Actualiza zona si es Blanes
                    calle = procesar_calle(calle_raw)
                else:
                    ubicacion_items = []

            lat, lon = get_lat_lon(calle if calle else zona)

        except ProtocolException:
            logging.warning(f"ID {listing_id}: No se encontró la sección de zona/mapa.")
        except Exception as e:
            logging.warning(f"ID {listing_id}: Error procesando zona/calle: {e}")

        data['zona'] = zona if zona else 'otra zona'
        data['calle'] = calle
        data['latitud'] = lat
        data['longitud'] = lon

        # Fecha publicación
        data['fecha_publicacion'] = await extraer_fecha_anuncio(tab)

        wait_time = random.randint(1, 3)
        time.sleep(wait_time)

        print(f"ID {listing_id}: Zona extraída: {data['zona']}")
        print(f"ID {listing_id}: Calle extraída: {data['calle']}")
        print(f"ID {listing_id}: Latitud extraída: {data['latitud']}")
        print(f"ID {listing_id}: Longitud extraída: {data['longitud']}")
        print(f"ID {listing_id}: Fecha publicación extraída: {data['fecha_publicacion']}")

        await tab.scroll_down(random.randint(25, 75)) # Ajusta según sea necesario
        # Descripción y flags (ocupado, habitable)
        descripcion_completa = None; ocupado = False; habitable = True
        try:
            await tab.wait_for("div.comment div.adCommentsLanguage p", timeout=5000)
            desc_p = await tab.select("div.comment div.adCommentsLanguage p")
            if desc_p:
                descripcion_completa = desc_p.text_all
                descripcion_lower = descripcion_completa.lower()
                if 'ocupado' in descripcion_lower or 'ocupada' in descripcion_lower: ocupado = True
                # Lógica mejorada para 'habitable'
                if 'sin cédula' in descripcion_lower or 'no dispone de cédula' in descripcion_lower:
                    habitable = False
                elif 'cédula de habitabilidad' in descripcion_lower:
                    # Si menciona la cédula pero no explícitamente que NO la tiene, asumimos que sí o es ambiguo.
                    # Podrías refinar esto buscando "dispone", "tiene", "en trámite", etc.
                    # De momento, si la menciona y no dice 'sin' o 'no dispone', la dejamos True.
                    pass


        except ProtocolException:
            logging.warning(f"ID {listing_id}: No se encontró el div de descripción.")
        except Exception as e:
            logging.warning(f"ID {listing_id}: Error procesando descripción: {e}")

        data['descripcion'] = descripcion_completa
        data['ocupado'] = ocupado
        data['habitable'] = habitable

        # Anunciante
        try:
            try:
                advertiser_element = await tab.find('a.about-advertiser-name')
                data['anunciante'] = advertiser_element.text.strip()
            except ProtocolException:
                print(f"ID {listing_id}: No es profesional, buscamos particular...")
                try:
                    particular_element = await tab.find('div.professional-name span')
                    if particular_element:
                        data['anunciante'] = 'particular_' + particular_element.text_all.strip()
                    else:
                        logging.warning(f"ID {listing_id}: Advertiser no encontrado. Posiblemente anuncio eliminado.")
                        return None
                except ProtocolException:
                    logging.warning(f"ID {listing_id}: No se encontró ni profesional ni particular.")
                    return None
        except Exception as e:
            logging.warning(f"ID {listing_id}: Error inesperado buscando el anunciante: {e}")
            return None

        # Características detalladas (div.details-property-feature-one)
        atributos = {'baños': 0, 'año_construccion': 0, 'terraza': False, 'balcon': False, 'garaje': False, 'ascensor': False, 'reforma': False}
        try:
            caracteristicas_div = await tab.find('div.details-property-feature-one')
            if caracteristicas_div:
                caracteristicas_items = await caracteristicas_div.query_selector_all('li')
                caracteristicas_text = [item.text.strip() for item in caracteristicas_items]

                for texto in caracteristicas_text:
                    texto_lower = texto.lower()
                    if re.search(r'\bhabitaci[oó]n(?:es)?\b', texto_lower):
                        num_hab = int(''.join(filter(str.isdigit, texto)) or 0)
                        if data['habitaciones'] == 0 or abs(data['habitaciones'] - num_hab) > 1 : data['habitaciones'] = num_hab
                    elif re.search(r'\bbañ[oa](?:s)?\b', texto_lower):
                        atributos['baños'] = int(''.join(filter(str.isdigit, texto)) or 0)
                    elif 'construido' in texto_lower or 'construcción' in texto_lower:
                        match = re.search(r'\b(1[89]\d{2}|20\d{2})\b', texto)
                        if match: atributos['año_construccion'] = int(match.group(1))
                    elif 'terraza' in texto_lower: atributos['terraza'] = True
                    elif 'balcón' in texto_lower or 'balcon' in texto_lower: atributos['balcon'] = True
                    elif 'garaje' in texto_lower: atributos['garaje'] = True
                    elif 'ascensor' in texto_lower:
                        if 'sin ascensor' not in texto_lower: atributos['ascensor'] = True
                        else: atributos['ascensor'] = False
                    elif 'para reformar' in texto_lower or 'a reformar' in texto_lower: atributos['reforma'] = True
                    elif 'buen estado' in texto_lower: atributos['reforma'] = False

        except ProtocolException:
            logging.warning(f"ID {listing_id}: No se encontró 'details-property-feature-one'.")
        except Exception as e:
            logging.warning(f"ID {listing_id}: Error procesando características detalladas: {e}")
        data.update(atributos)

        # Equipamiento (div.details-property-feature-two)
        atributos_equipamiento = {'jardin': False, 'piscina': False, 'aire_acondicionado': False}
        try:
             equipamiento_div = await tab.find('div.details-property-feature-two')
             if equipamiento_div:
                 equipamiento_items = await equipamiento_div.query_selector_all('li')
                 equipamiento_text = [item.text.strip().lower() for item in equipamiento_items]
                 for texto in equipamiento_text:
                     if 'jardín' in texto or 'jardin' in texto: atributos_equipamiento['jardin'] = True
                     elif 'piscina' in texto: atributos_equipamiento['piscina'] = True
                     elif 'aire acondicionado' in texto: atributos_equipamiento['aire_acondicionado'] = True
        except ProtocolException:
            logging.warning(f"ID {listing_id}: No se encontró 'details-property-feature-two'.")
        except Exception as e:
            logging.warning(f"ID {listing_id}: Error procesando equipamiento: {e}")
        data.update(atributos_equipamiento) # Añade equipamiento al dict principal

        logging.info(f"ID {listing_id}: Extracción de datos completada con éxito.")
        return pd.DataFrame([data])

    except uc.util.TimeoutError as e:
        logging.error(f"ID {listing_id}: Timeout general durante el scraping de {url} - {e}")
        data['error'] = f"Timeout general: {e}"
        return pd.DataFrame([data])
    except Exception as e:
        logging.error(f"ID {listing_id}: Error inesperado y no capturado durante el scraping de {url}: {e}", exc_info=True)
        data['error'] = f"Error inesperado: {str(e)}"
        return pd.DataFrame([data])

# ==============================================================================
# --- FIN FUNCIÓN DE SCRAPING REFACTORIZADA ---
# ==============================================================================


# ==============================================================================
# --- FUNCIÓN PRINCIPAL (main) ---
# ==============================================================================
async def main():
    """
    Función principal que orquesta el proceso de scraping.
    """
    # 1. Leer IDs de pisos de la base de datos
    response = supabase.table("pisos").select("*").eq("activo", True).execute()
    df = pd.DataFrame(response.data)

    # 2. Filtrar por pisos con datos faltantes en los campos críticos
    campos_criticos = ["titulo", "precio", "metros", "habitaciones", "zona", "latitud", "longitud", "descripcion"]
    faltan_datos = df[df[campos_criticos].isnull().any(axis=1)]
    listing_ids = faltan_datos["url_id"].dropna().astype(str).tolist()

    if not listing_ids:
        logging.warning("No se encontraron pisos nuevos o incompletos para scrapear.")
        return
    else:
        logging.info(f"Se encontraron {len(listing_ids)} pisos incompletos para scrapear.")

    # 3. Iniciar el navegador con nodriver
    scraped_data_list = []
    browser = await uc.start()
    tab = await browser.get('about:blank')
    try:
        logging.info("Iniciando navegador...")
        logging.info("Navegador iniciado correctamente.")

        # 3. Iterar sobre los IDs y scrapear cada uno usando la nueva función
        current_datetime = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        for i, listing_id in enumerate(listing_ids):
            url = f"https://www.idealista.com/inmueble/{listing_id}/"
            # *** LLAMADA A LA FUNCIÓN REFACTORIZADA ***
            scraped_data = await scrap_idealista_property_nodriver(tab, url, listing_id)
            #scraped_data_list.append(scraped_data)

            if scraped_data is not None and not scraped_data.empty:
                if 'descripcion' in scraped_data.columns:
                    scraped_data['descripcion'] = scraped_data['descripcion'].apply(lambda x: x.replace('\n', ' ') if isinstance(x, str) else x)
                scraped_data['id'] = listing_id
                scraped_data['url'] = url

                # save the dataframe to a csv file with current date and time
                csv_path = f'../data/scrappedFiles/blanes_scrapped_{current_datetime}.csv'
                write_header = not os.path.exists(csv_path)
                scraped_data.to_csv(csv_path, mode='a', header=write_header, index=False)
                time.sleep(random.randint(1, 3))
            else:
                continue
                print(f"[ID {id_piso}] ⚠️ No se guardó (vacío o error).")

            # Pausa antes de la siguiente petición
            if i < len(listing_ids) - 1:
                logging.info(f"Esperando {REQUEST_DELAY} segundos antes de la siguiente petición...")
                await asyncio.sleep(REQUEST_DELAY)

    except Exception as e:
        logging.critical(f"Error crítico durante la sesión del navegador: {e}", exc_info=True)
    finally:
        # 4. Cerrar el navegador
        if browser:
            logging.info("Cerrando navegador...")
            try:
                await browser.stop()
            except Exception as close_err:
                 logging.error(f"Error al intentar cerrar el navegador: {close_err}. Intentando uc.stop()")
                 try: await uc.stop()
                 except Exception as stop_err: logging.error(f"Error al intentar uc.stop(): {stop_err}")


# ==============================================================================
# --- PUNTO DE ENTRADA ---
# ==============================================================================
if __name__ == "__main__":
    # Ejecuta la función principal asíncrona
    uc.loop().run_until_complete(main())