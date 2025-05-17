// Paso 1: Instala Recharts si no lo tienes
// npm install recharts

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import "./ZonaTendenciaChart.css";

const ZonaTendenciaChart = ({ zona }) => {
  const [tendenciaData, setTendenciaData] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    if (!zona) return;

    fetch(`${API_URL}/zona/tendencia?id=${encodeURIComponent(zona)}`)
      .then((res) => res.json())
      .then((data) => {
        setTendenciaData(data);
      })
      .catch((err) => console.error("Error cargando tendencia:", err));
  }, [zona]);

  if (!tendenciaData || !tendenciaData.serie) return <p>Cargando gráfico...</p>;

  // Calculate average price for reference line
  const avgPrice = tendenciaData.serie.reduce((acc, curr) => acc + curr.precio_m2, 0) / tendenciaData.serie.length;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-price">
            {payload[0].value.toLocaleString()}€/m²
          </p>
          <p className="tooltip-variation">
            {payload[0].value > avgPrice ? '↑' : '↓'} 
            {Math.abs(((payload[0].value - avgPrice) / avgPrice) * 100).toFixed(1)}% vs media
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="zona-tendencia-chart">
      <h4>Evolución del precio por m²</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart 
          data={tendenciaData.serie} 
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="mes" 
            stroke="#888"
            tick={{ fill: '#888' }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tickFormatter={(v) => `${v}€`}
            stroke="#888"
            tick={{ fill: '#888' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={avgPrice} 
            stroke="#666" 
            strokeDasharray="3 3"
            label={{ 
              value: 'Media', 
              position: 'right',
              fill: '#666'
            }} 
          />
          <Line 
            type="monotone" 
            dataKey="precio_m2" 
            stroke="#e74c3c"
            strokeWidth={3}
            dot={{ 
              stroke: '#e74c3c',
              strokeWidth: 2,
              r: 4,
              fill: '#fff'
            }}
            activeDot={{ 
              stroke: '#e74c3c',
              strokeWidth: 2,
              r: 6,
              fill: '#fff'
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-summary">
        <span className={`trend-indicator ${tendenciaData.tendencia}`}>
          {tendenciaData.tendencia === "subiendo" ? "↗" : 
           tendenciaData.tendencia === "bajando" ? "↘" : "→"} 
          {tendenciaData.variacion_pct}%
        </span>
        <span className="average-price">
          Media: {avgPrice.toLocaleString()}€/m²
        </span>
      </div>
    </div>
  );
};

export default ZonaTendenciaChart;
