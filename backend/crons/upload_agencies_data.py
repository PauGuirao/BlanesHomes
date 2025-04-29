from supabase import create_client, Client
import os
import pandas as pd
from dotenv import load_dotenv

# ======== CONFIGURACIÓN ========
load_dotenv()

# Supabase config
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

# Obtener todos los anunciantes únicos
pisos_data = supabase.table("pisos").select("url_id,anunciante").execute().data
df = pd.DataFrame(pisos_data)
anunciantes = df["anunciante"].dropna().unique()

# Insertar agencias (si no existen aún)
for nombre in anunciantes:
    res = supabase.table("agencias").select("*").eq("nombre", nombre).execute()
    if not res.data:
        nueva = supabase.table("agencias").insert({"nombre": nombre}).execute()
        agencia_id = nueva.data[0]["id"]
    else:
        agencia_id = res.data[0]["id"]

    # Actualizar todos los pisos que usan ese anunciante
    supabase.table("pisos").update({"agencia_id": agencia_id}).eq("anunciante", nombre).execute()

print("✔️ Agencias vinculadas correctamente.")
