import React from 'react';
import ZonaTendenciaChart from "./ZonaTendenciaChart";
import ZonaActividadChart from "./ZonaActividadChart";

function ZonaTrends({ zonaStats, zona }) {
  return (
    <div className="zona-trends">
      <div className="stat-group">
        <h3>Tendencia del mercado</h3>
        <div className="stat-item">
          <span>📈 Tendencia actual:</span>
          <span>
            {zonaStats.tendencia === "subiendo" && "📈 Subiendo"}
            {zonaStats.tendencia === "bajando" && "📉 Bajando"}
            {zonaStats.tendencia === "estable" && "⏸️ Estable"}
          </span>
        </div>
        <div className="stat-item">
          <span>📊 Variación:</span>
          <span>{zonaStats.variacion_pct !== null ? `${zonaStats.variacion_pct}%` : 'N/A'}</span>
        </div>
        <div className="trend-chart">
          <ZonaTendenciaChart zona={zona} />
        </div>
        <div className="trend-chart">
          <ZonaActividadChart zona={zona} />
        </div>
      </div>
    </div>
  );
}

export default ZonaTrends;