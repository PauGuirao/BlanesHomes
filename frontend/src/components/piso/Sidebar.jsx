import "./Sidebar.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import HipotecaTab from "../HipotecaTab"; // Asegúrate de que la ruta sea correcta
import RecomendadosTab from "../RecomendadosTab";

const Sidebar = ({ piso, onClose, onCompare }) => {
  if (!piso) return null;
  const [recomendados, setRecomendados] = useState([]);
  const [tab, setTab] = useState("compra"); // por defecto la tab dinámica
  
  // Helper function to format price difference in a simplified way
  const formatPriceDifference = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M €`;
    } else if (amount >= 1000) {
      return `${Math.round(amount / 1000)}k €`;
    } else {
      return `${Math.round(amount)} €`;
    }
  };
  
  useEffect(() => {
    if (piso) {
      setTab("compra");
      axios
        .post(`http://localhost:8000/recomendaciones?id=${piso.id}`) // ajusta el parámetro si es necesario
        .then((res) => setRecomendados(res.data))
        .catch((err) => console.error("Error al cargar recomendaciones", err));
    }
  }, [piso]);

  // Capitalize first letter of property type
  console.log("Tipo de piso:", piso);
  const capitalizedType = piso.tipo.charAt(0).toUpperCase() + piso.tipo.slice(1).toLowerCase();
  const formattedTitle = capitalizedType;

  return (
    <div className="sidebar">
      <h2>
        {formattedTitle} <span className="zona-subtitle">en {piso.zona}</span>
      </h2>
      <div className="sidebar-section-2">
        <div className="sidebar-attribute">
          <span role="img" aria-label="money">
            💰 <strong> Precio:</strong>
          </span>{" "}
          <p>{piso.precio.toLocaleString()} €</p>
        </div>
        <div className="sidebar-attribute">
          <span role="img" aria-label="lightbulb">
            📍 <strong>Zona:</strong>
          </span>{" "}
          <p style={{ fontSize: "14px" }}> {piso.zona}</p>
        </div>
      </div>

      <div className="sidebar-section-3">
        <div className="sidebar-attribute">
          <span role="img" aria-label="ruler">
            <strong>Metros:</strong>
          </span>{" "}
          <p>{piso.metros} m²</p>
        </div>
        <div className="sidebar-attribute">
          <span role="img" aria-label="ruler">
            <strong>Habitaciones:</strong>
          </span>{" "}
          <p>{piso.habitaciones}</p>
        </div>
        <div className="sidebar-attribute">
          <span role="img" aria-label="ruler">
            <strong>Baños:</strong>
          </span>{" "}
          <p>{piso.baños}</p>
        </div>
      </div>

      {/* Extras section - always show */}
      <div className="sidebar-extras">
        <h3>Extras</h3>
        <div className="extras-container">
          {piso.garaje === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="garage">🚗</span>
              <p>Garaje</p>
            </div>
          )}
          {piso.piscina === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="pool">🏊</span>
              <p>Piscina</p>
            </div>
          )}
          {piso.terraza === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="terrace">🏞️</span>
              <p>Terraza</p>
            </div>
          )}
          {piso.ascensor === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="elevator">🔼</span>
              <p>Ascensor</p>
            </div>
          )}
          {piso.balcon === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="balcony">🏙️</span>
              <p>Balcón</p>
            </div>
          )}
          {piso.aire_acondicionado === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="ac">❄️</span>
              <p>A/C</p>
            </div>
          )}
          {piso.jardin === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="garden">🌳</span>
              <p>Jardín</p>
            </div>
          )}
          {(piso.n_extras === 0) && (
            <p className="no-extras">No hay extras disponibles para esta propiedad</p>
            
          )}
        </div>
      </div>

      <div className="sidebar-estimacion">
        <div className="ia-label">🤖 Nuestra IA estima:</div>
        <div className="estimado-precio">
          <span className="predicted-price">{Math.round(piso.precio_estimado).toLocaleString()} €</span>
          <div className="price-difference">
            <span className={piso.precio > piso.precio_estimado ? "overpriced" : "underpriced"}>
              {piso.precio > piso.precio_estimado ? "+" : "-"}
              {Math.abs(((piso.precio - piso.precio_estimado) / piso.precio_estimado) * 100).toFixed(1)}%
            </span>
            <span className="difference-amount">
              ({piso.precio > piso.precio_estimado ? "+" : "-"}{formatPriceDifference(Math.abs(piso.precio - piso.precio_estimado))})
            </span>
          </div>
        </div>
      </div>

      {/* Alert for occupied properties */}
      {piso.ocupado === 1 && (
        <div className="sidebar-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <div className="alert-title">Propiedad ocupada</div>
            <div className="alert-description">Esta propiedad está actualmente ocupada. Consulta con la agencia para más detalles.</div>
          </div>
        </div>
      )}

      <button 
          className="compare-action" 
          onClick={() => onCompare(piso)}
        >
          🔍 Añadir a comparador
        </button>

      {/* 🧭 Selector de pestañas */}
      <div className="sidebar-tabs">
        <button
          className={tab === "compra" ? "active" : ""}
          onClick={() => setTab("compra")}
        >
          🏦 Compra
        </button>
        <button
          className={tab === "inversion" ? "active" : ""}
          onClick={() => setTab("inversion")}
        >
          🔍 Similares
        </button>
      </div>
      {tab === "compra" && <HipotecaTab precio={piso.precio} />}
      {recomendados.length > 0 && tab === "inversion" && (
        <RecomendadosTab recomendados={recomendados} />
      )}
    </div>
  );
};

export default Sidebar;
