import pandas as pd
import numpy as np

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# ======== CONFIGURACIÓN ========
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Load the CSV file into a DataFrame
file_path = '../data/processedFiles/lloret-de-mar-girona_data_NEW_20250430_174546.csv'
df = pd.read_csv(file_path)

# Remove duplicate rows
df = df.drop_duplicates(subset='url_id')

df['activo'] = True

# remove the zona_<zona> columns but not zona_id
df = df.drop(columns=[col for col in df.columns if col.startswith('zona_') and col != 'zona_id'])
# remove the tipo_<tipo> columns but not tipo_id
df = df.drop(columns=[col for col in df.columns if col.startswith('tipo_') and col != 'tipo_id'])
# remove the zona
df = df.drop(columns=['zona'])
# remove the tipo
df = df.drop(columns=['tipo'])

# Replace empty strings in 'ratio_habitaciones_baños' with NaN
df['ratio_habitaciones_baños'] = df['ratio_habitaciones_baños'].replace("", np.nan)

df = df.where(pd.notnull(df), 0)  # Reemplazar NaN por None (para que Supabase lo tome como NULL)

# Convert zona_id and tipo_id to integers if they're floats
df['zona_id'] = df['zona_id'].fillna(0).astype(int)
df['tipo_id'] = df['tipo_id'].fillna(0).astype(int)


# ======== CONECTAR Y SUBIR A SUPABASE ========
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# Insertar en bloques (batch)
data = df.to_dict(orient="records")
batch_size = 500
batches = [data[i:i + batch_size] for i in range(0, len(data), batch_size)]

for i, batch in enumerate(batches):
    try:
        res = supabase.table("pisos").upsert(batch, on_conflict="url_id").execute()
        print(f"✔️ Lote {i+1} subido correctamente")
    except Exception as e:
        print(f"❌ Error en el lote {i+1}: {e}")