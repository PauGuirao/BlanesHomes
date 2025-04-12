from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uvicorn
import joblib

app = FastAPI()

# CORS: permite que el frontend acceda a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carga del modelo
model = joblib.load("models/modelo_xgboost.pkl")
drop_cols = ['id','titulo', 'calle', 'fecha_publicacion', 'zona']


# Cargar dataset (puedes cambiar la ruta si está en otro lugar)
df = pd.read_csv("data/idealista_procesado.csv")
df.reset_index(inplace=True)
df.rename(columns={"index": "id"}, inplace=True)
X = df.drop(columns=drop_cols + ['precio'])
features = list(X.columns)

# Detectar columnas que empiezan por "tipo_"
tipo_cols = [col for col in df.columns if col.startswith("tipo_")]

# Crear una nueva columna "tipo" con el nombre del tipo activo
df["tipo"] = df[tipo_cols].idxmax(axis=1).str.replace("tipo_", "")

#prediccion
df['precio_estimado'] = model.predict(df[features])
df['categoria_valor'] = df.apply(lambda row: (
    'ganga' if row['precio'] < row['precio_estimado'] * 0.9 else
    'caro' if row['precio'] > row['precio_estimado'] * 1.1 else
    'justo'
), axis=1)

df['valoracion_score'] = (df['precio'] - df['precio_estimado']) / df['precio_estimado']

zona_coords = {
    "Centre": (41.673774, 2.791094),
    "La Plantera": (41.668101, 2.774309),
    "Els Pins": (41.662931, 2.781882),
    "Els Pavos": (41.675115, 2.781567),
    "Semicentre": (41.678307, 2.787425),
    "Mont Ferrant - Sant Joan": (41.678658, 2.794806),
    "Cala Sant Francesc - Santa Cristina": (41.679922, 2.806074)
}

precio_m2_por_zona = df.groupby("zona")["precio_m2"].mean().to_dict()

@app.get("/pisos")
def get_pisos():
    resultado = df.head(300)
    return resultado[[
        'id','latitud', 'longitud', 'metros', 'precio', 'zona', 'categoria_valor', 'precio_estimado', 'tipo', 'valoracion_score', 'habitaciones', 'baños',
    ]].to_dict(orient="records")

@app.post("/estimar_precio")
async def estimar_precio(data: Request):
    input_data = await data.json()
    df_input = pd.DataFrame([input_data])
    # Convierte explícitamente los campos numéricos a int
    for col in ['metros', 'habitaciones', 'baños']:
        df_input[col] = pd.to_numeric(df_input[col], errors='coerce')

    # añadir los datos faltantes al dataframe original
    df_input["ratio_habitaciones_baños"] = df_input["habitaciones"] / (df_input["baños"] + 1e-5)

    zona = df_input.loc[0, "zona"]
    lat, lon = zona_coords.get(zona, (41.675, 2.792))  # valor por defecto si no encuentra
    df_input["latitud"] = lat
    df_input["longitud"] = lon
    df_input["precio_m2"] = precio_m2_por_zona.get(zona, df["precio_m2"].mean())

    df_encoded = pd.get_dummies(df_input)
    # Convierte SOLO las columnas booleanas a int (las dummies)
    bool_cols = df_encoded.select_dtypes(bool).columns
    df_encoded[bool_cols] = df_encoded[bool_cols].astype(int)
    for col in features:
        if col not in df_encoded.columns:
            df_encoded[col] = 0  # completar con 0 las columnas que no estén

    df_encoded = df_encoded[features]  # asegurarse del orden
    pred = model.predict(df_encoded)[0]

    return {"precio_estimado": int(pred)}

@app.post("/recomendaciones")
def recomendaciones(id: int):
    piso = df[df["id"] == id].iloc[0]

    precio_real = piso['precio']
    precio_estimado = piso['precio_estimado']

    # Filtro: pisos más baratos o igual precio real
    candidatos = df[
        (df['precio'] <= precio_real) &
        (df['id'] != piso['id'])  # evitar el mismo piso
    ].copy()

    # Filtro: que la IA considere que están mejor valorados
    mejores = candidatos[candidatos['precio_estimado'] > precio_estimado]

    # Opcional: ordenar por cuánto "mejores" son
    mejores['ganancia_ia'] = mejores['precio_estimado'] - mejores['precio']
    recomendados = mejores.sort_values(by='ganancia_ia', ascending=False).head(5)

    return recomendados.to_dict(orient="records")

@app.post("/sugerencias")
async def sugerencias(data: Request):
    body = await data.json()
    precio_estimado = body.get("precio_estimado")
    zona = body.get("zona")
    tipo = body.get("tipo")
    habitaciones = body.get("habitaciones")
    baños = body.get("baños")
    metros = body.get("metros")

    print(f"Recibido: {precio_estimado}, {zona}, {tipo}, {habitaciones}, {baños}, {metros}")

    if precio_estimado is None:
        return {"error": "precio_estimado requerido"}, 400

    margen = 0.10
    min_precio = precio_estimado * (1 - margen)
    max_precio = precio_estimado * (1 + margen)

    candidatos = df[
        (df['precio'] >= min_precio) &
        (df['precio'] <= max_precio)
    ]

    if zona:
        candidatos = candidatos[df['zona'] == zona]
    if tipo:
        candidatos = candidatos[df['tipo'] == tipo]
    if habitaciones:
        candidatos = candidatos[df['habitaciones'] >= int(habitaciones)]
    if baños:
        candidatos = candidatos[df['baños'] >= int(baños)]
    if metros:
        candidatos = candidatos[df['metros'] >= int(metros)]

    recomendados = candidatos.sort_values(by='precio_m2').head(5)
    print(recomendados)
    return recomendados.to_dict(orient="records")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
