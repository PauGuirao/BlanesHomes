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
file_path = '../data/processedFiles/blanes_data_20250422_191106.csv'
df = pd.read_csv(file_path)

# Remove duplicate rows
df = df.drop_duplicates(subset='url_id')
# Add a new column 'city' with the value 'Blanes'
df['city'] = 'Blanes'

df['activo'] = True

# Replace empty strings in 'ratio_habitaciones_baños' with NaN
df['ratio_habitaciones_baños'] = df['ratio_habitaciones_baños'].replace("", np.nan)

df = df.where(pd.notnull(df), 0)  # Reemplazar NaN por None (para que Supabase lo tome como NULL)

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