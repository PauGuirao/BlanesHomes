import React from "react";
import "./RecomendadosTab.css";

const RecomendadosTab = ({ recomendados }) => {
  if (!recomendados || recomendados.length === 0) return null;

  return (
    <div className="recomendados-block">
      <h3>🏡 Recomendaciones de inversión</h3>
      <div className="recomendados-grid">
        {recomendados.map((piso, index) => (
          <div className="recomendado-card" key={index}>
            <div className="recomendado-header">
              <strong>{piso.tipo}</strong> en {piso.zona}
            </div>
            <div className="recomendado-info">
              <p>{piso.metros} m²</p>
              <p>💰 {piso.precio.toLocaleString()} €</p>
              <p>🤖 Estimado: {piso.precio_estimado.toLocaleString()} €</p>
              <p>
                📉 Diferencia:{" "}
                <strong
                  style={{
                    color:
                      piso.precio < piso.precio_estimado * 0.9
                        ? "#2ecc71"
                        : piso.precio > piso.precio_estimado * 1.1
                        ? "#e74c3c"
                        : "#f1c40f",
                  }}
                >
                  {piso.precio_estimado - piso.precio} €
                </strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecomendadosTab;
