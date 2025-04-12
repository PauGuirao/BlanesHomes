import React, { useState } from "react";
import axios from "axios";
import "./PisoForm.css"; // si quieres un CSS separado

function PisoForm({ onClose }) {
  const [formData, setFormData] = useState({
    metros: "",
    habitaciones: "",
    baños: "",
    zona: "",
    tipo: "",
    jardin: false,
    piscina: false,
    balcon: false,
    terraza: false,
    garaje: false,
    ascensor: false,
    aire_acondicionado: false,
  });

  const [precioEstimado, setPrecioEstimado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:8000/estimar_precio",
        formData
      );
      setPrecioEstimado(res.data.precio_estimado);

      // Llamar al endpoint de sugerencias
      const sugerenciaRes = await axios.post(
        "http://localhost:8000/sugerencias",
        {
          ...formData,
          precio_estimado: res.data.precio_estimado,
        }
      );
      setSugerencias(sugerenciaRes.data);
    } catch (error) {
      console.error("Error estimando precio", error);
    }
  };

  return (
    <div className="piso-form">
      <h2>🔍 Estima un piso</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="metros">Zona</label>
            <select
              name="zona"
              value={formData.zona}
              onChange={handleChange}
              required
            >
              <option value="Centre">Centre</option>
              <option value="La Plantera">La Plantera</option>
              <option value="Els Pins">Els Pins</option>
              <option value="Els Pavos">Els Pavos</option>
              <option value="Semicentre">Semicentre</option>
              <option value="Mont Ferrant - Sant Joan">
                Mont Ferrant - Sant Joan
              </option>
              <option value="Cala Sant Francesc - Santa Cristina">
                Cala Sant Francesc - Santa Cristina
              </option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="metros">Tipo</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
            >
              <option value="piso">Piso</option>
              <option value="casa">Casa</option>
              <option value="estudio">Estudio</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="metros">Metros</label>
            <input
              type="number"
              name="metros"
              placeholder="Metros cuadrados"
              value={formData.metros}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="metros">Habitaciones</label>
            <input
              type="number"
              name="habitaciones"
              placeholder="Nº de habitaciones"
              value={formData.habitaciones}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="metros">Baños</label>
            <input
              type="number"
              name="baños"
              placeholder="Nº de baños"
              value={formData.baños}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-section">
          <label className="section-title">Extras</label>
          <div className="checkbox-group">
            {[
              "jardin",
              "piscina",
              "balcon",
              "terraza",
              "garaje",
              "ascensor",
              "aire_acondicionado",
            ].map((extra) => (
              <label key={extra}>
                <input
                  type="checkbox"
                  name={extra}
                  checked={formData[extra]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [extra]: e.target.checked,
                    })
                  }
                />
                {extra.charAt(0).toUpperCase() +
                  extra.slice(1).replace("_", " ")}
              </label>
            ))}
          </div>
        </div>
        <button type="submit">Estimar precio</button>
      </form>
      <button onClick={onClose}>Cerrar</button>

      {precioEstimado !== null && (
        <div className="resultado">
          <h3>💰 Precio estimado: {precioEstimado.toLocaleString()} €</h3>
        </div>
      )}
      {sugerencias.length > 0 && (
        <div className="sugerencias">
          <h3>🏘 Opciones similares en el mercado:</h3>
          {sugerencias.map((p, i) => (
            <div key={i} className="sugerencia-card">
              <div>
                <strong>{p.tipo}</strong> en {p.zona}
              </div>
              <div>
                {p.metros} m² · {p.habitaciones} hab · {p.baños} baños
              </div>
              <div>💰 {p.precio.toLocaleString()} €</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PisoForm;
