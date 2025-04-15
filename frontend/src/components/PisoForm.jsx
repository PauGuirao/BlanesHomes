import React, { useState } from "react";
import axios from "axios";
import "./PisoForm.css"; // si quieres un CSS separado

function PisoForm({ onClose, onSugerenciaClick }) {  // Add onSugerenciaClick prop
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
      <button onClick={onClose} className="close-button">✕</button>
      <h2>Busca un piso</h2>
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
        <label className="section-title">Extras</label>
        <div className="form-section extras-section">
          <div className="extras-grid">
            {[
              "jardin",
              "piscina",
              "balcon",
              "terraza",
              "garaje",
              "ascensor",
              "aire_acondicionado",
            ].map((name) => (
              <label key={name} className="extra-item">
                <input
                  type="checkbox"
                  name={name}
                  checked={formData[name]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [name]: e.target.checked,
                    })
                  }
                />
                <span className="extra-text">
                  {name.charAt(0).toUpperCase() + name.slice(1).replace("_", " ")}
                </span>
              </label>
            ))}
          </div>
        </div>
        <button type="submit" className="submit-button">Estimar precio</button>
      </form>

      {precioEstimado !== null && (
        <div className="resultado-section">
          <div className="resultado-card">
            <h3>Nuestra IA estima</h3>
            <div className="precio-estimado">
              {precioEstimado.toLocaleString()} €
            </div>
          </div>
        </div>
      )}
      
      {sugerencias.length > 0 && (
        <div className="sugerencias-section">
          <h3>🏘 Propiedades similares</h3>
          <div className="sugerencias-grid">
            {sugerencias.map((p, i) => (
              <div 
                key={i} 
                className="sugerencia-card"
                onClick={() => onSugerenciaClick(p)}
                role="button"
                tabIndex={0}
              >
                <div className="sugerencia-tipo">{p.tipo} en {p.zona}</div>
                <div className="sugerencia-detalles">
                  <span>{p.metros} m²</span>
                  <span>{p.habitaciones} hab</span>
                  <span>{p.baños} baños</span>
                </div>
                <div className="sugerencia-precio">{p.precio.toLocaleString()} €</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PisoForm;
