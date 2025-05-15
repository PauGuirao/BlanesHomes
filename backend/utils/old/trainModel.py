import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

# Carga tu dataset
df = pd.read_csv('idealista_procesado.csv')

# Variables que no usarás como input
drop_cols = ['titulo', 'calle', 'fecha_publicacion', 'zona']

# Selecciona las features y la variable objetivo
X = df.drop(columns=drop_cols + ['precio'])
y = df['precio']

# Dividir en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)


# Crear el modelo
model = xgb.XGBRegressor(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1,
    random_state=42
)

# Entrenar
model.fit(X_train, y_train)

# Predicciones
y_pred = model.predict(X_test)

# Métricas
mae = mean_absolute_error(y_test, y_pred)
rmse = mean_squared_error(y_test, y_pred, squared=False)
r2 = r2_score(y_test, y_pred)

print(f"MAE:  {mae:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"R²:   {r2:.2f}")

# Crear un DataFrame con los valores reales y los predichos
comparison_df = pd.DataFrame({
    'precio_real': y_test.values,
    'precio_predicho': y_pred
})
# Diferencia absoluta entre real y predicho
comparison_df['diferencia_absoluta'] = abs(comparison_df['precio_real'] - comparison_df['precio_predicho'])

# Porcentaje de error relativo respecto al precio real
comparison_df['error_relativo_%'] = 100 * comparison_df['diferencia_absoluta'] / comparison_df['precio_real']

print(comparison_df.round(2).head(10))