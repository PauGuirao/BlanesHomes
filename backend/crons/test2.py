import json
from supabase import create_client, Client

# Tu Supabase project info
url = "https://ftxgkubrssoysnfiqgsa.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eGdrdWJyc3NveXNuZmlxZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzgyOTIsImV4cCI6MjA2MDY1NDI5Mn0.9JaYEGW7nhihSDCbTBKNVKJu6hgTmVJv71b_9YaIHaY"
supabase: Client = create_client(url, key)

zona_a_calle = {
    'Centre': 'carrer ample',
    'Semicentre': 'carrer anselm clavé,62',
    'Els Pavos': 'carrer provença,4',
    'mas florit': 'carrer de montblanc',
    'ca la guidó': 'carrer joan oliver',
    'La Plantera': 'carrer béjar',
    'Els Pins': 'carrer vila de paris',
    'Mont Ferrant - Sant Joan': 'carrer de santa bàrbara, 37-33',
    'Cala Sant Francesc - Santa Cristina': 'carrer de la cala',
}

for nombre_zona, calle in zona_a_calle.items():
    # Normaliza nombre para emparejar correctamente
    nombre_zona_normalizado = nombre_zona.strip()

    # Buscar la zona y actualizar su mainStreet
    response = supabase.table("zonas") \
        .update({"mainStreet": calle}) \
        .eq("nombre", nombre_zona_normalizado) \
        .execute()

    if hasattr(response, "error") and response.error is not None:
        print(f"❌ Error actualizando {nombre_zona}: {response.error.message}")
    else:
        print(f"✅ MainStreet asignado a '{nombre_zona}': {calle}")
