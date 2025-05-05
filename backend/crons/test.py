import json
from supabase import create_client, Client

# Tu Supabase project info
url = "https://ftxgkubrssoysnfiqgsa.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eGdrdWJyc3NveXNuZmlxZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzgyOTIsImV4cCI6MjA2MDY1NDI5Mn0.9JaYEGW7nhihSDCbTBKNVKJu6hgTmVJv71b_9YaIHaY"
supabase: Client = create_client(url, key)

# Cargar zonas desde archivo JSON
with open("zonas.json", "r") as f:
    zonas = json.load(f)

for nombre_zona, puntos in zonas.items():
    # Convertir [lat, lon] a [lon, lat]
    geojson = {
        "type": "Polygon",
        "coordinates": [[
            [lon, lat] for lat, lon in puntos
        ]]
    }

    # Hacer update en Supabase
    res = supabase.table("zonas").update({"poligon": geojson}).eq("nombre", nombre_zona).execute()
    
    if hasattr(res, "error") and res.error is not None:
        print(f"❌ Error al actualizar {nombre_zona}: {res.error.message}")
    else:
        print(f"✅ Zona '{nombre_zona}' actualizada correctamente.")
