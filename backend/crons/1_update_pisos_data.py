import pandas as pd
import numpy as np

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# ======== CONFIGURACIÓN ========
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load the pisos from the database
data_piso = supabase.table("pisos").select("*").execute().data
# Convertir a diccionario
db_pisos_dict = {
    str(p["url_id"]): int(p["precio"])
    for p in data_piso if p["url_id"] is not None
}

# Load the pisos ids CSV file into a DataFrame
file_path = '../data/idFiles/ids_20250422.csv'
df_scraped = pd.read_csv(file_path)
# Convertir a diccionario
scraped_pisos_dict = {
    str(row['id']): int(row['precio'])
    for _, row in df_scraped.iterrows()
}

# Find the differences
ids_scraped = set(scraped_pisos_dict.keys())
ids_db = set(db_pisos_dict.keys())

nuevos = ids_scraped - ids_db
eliminados = ids_db - ids_scraped
actualizar = {
    i for i in ids_scraped & ids_db
    if scraped_pisos_dict[i] != db_pisos_dict[i]
}

# Para los nuevos pisos, insertarlos en la base de datos
for id in nuevos:
    supabase.table("pisos").insert({
        "url_id": id,
        "precio": scraped_pisos_dict[id],
        "activo": True
    }).execute()

    # Registrar en historial
    supabase.table("historial_precios").insert({
        "url_id": id,
        "precio": precio,
        "fecha": date.today().isoformat()
    }).execute()

# Para los pisos eliminados, actualizar el campo activo a False
for id in eliminados:
    supabase.table("pisos").update({
        "activo": False
    }).eq("url_id", id).execute()

# Para los pisos actualizados, actualizar el campo precio
for id in actualizar:
    supabase.table("pisos").update({
        "precio": scraped_pisos_dict[id]
    }).eq("url_id", id).execute()

    # Guardar cambio en historial
    supabase.table("historial_precios").insert({
        "url_id": id,
        "precio": nuevo_precio,
        "fecha": date.today().isoformat()
    }).execute()