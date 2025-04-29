import React from "react";
import "./RecomendadosTab.css";

const RecomendadosTab = ({ recomendados }) => {
  if (!recomendados || recomendados.length === 0) return null;

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

  return (
    <div className="recomendados-block">
      <div className="recomendados-grid">
        {recomendados.map((piso, index) => (
          <div className="recomendado-card" key={index}>
            <div className="recomendado-header">
              <div>
                <strong>{piso.tipo.charAt(0).toUpperCase() + piso.tipo.slice(1).toLowerCase()}</strong> en {piso.zona}
              </div>
              <div className="recomendado-price">
                {piso.precio.toLocaleString()} €
              </div>
            </div>
            <div className="recomendado-info">
              <div className="recomendado-details">
                <span className="detail-item">
                  <strong>{piso.metros}</strong> m²
                </span>
                <span className="detail-item">
                  <strong>{piso.habitaciones}</strong> hab
                </span>
                <span className="detail-item">
                  <strong>{piso.baños}</strong> baños
                </span>
              </div>
              <div className="recomendado-ai-price">
                <span className="ai-price-label">🤖 Nuestra IA estima:</span>
                <span className="ai-price-value">{Math.round(piso.precio_estimado).toLocaleString()} €</span>
                <span className={piso.precio > piso.precio_estimado ? "overpriced" : "underpriced"}>
                  ({piso.precio > piso.precio_estimado ? "+" : "-"}
                  {Math.abs(((piso.precio - piso.precio_estimado) / piso.precio_estimado) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="recomendado-extras">
                {piso.garaje === 1 && <span className="extra-icon" title="Garaje">🚗</span>}
                {piso.piscina === 1 && <span className="extra-icon" title="Piscina">🏊</span>}
                {piso.terraza === 1 && <span className="extra-icon" title="Terraza">🏞️</span>}
                {piso.ascensor === 1 && <span className="extra-icon" title="Ascensor">🔼</span>}
                {piso.balcon === 1 && <span className="extra-icon" title="Balcón">🏙️</span>}
                {piso.aire_acondicionado === 1 && <span className="extra-icon" title="A/C">❄️</span>}
                {piso.jardin === 1 && <span className="extra-icon" title="Jardín">🌳</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecomendadosTab;
