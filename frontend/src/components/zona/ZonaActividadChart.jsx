// Componente: ZonaActividadChart.jsx
// Requiere: npm install recharts

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ZonaActividadChart = ({ zona }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!zona) return;
    fetch(`http://localhost:8000/zona/actividad?id=${encodeURIComponent(zona)}`)
      .then((res) => res.json())
      .then((data) => setData(data.actividad))
      .catch((err) => console.error("Error cargando actividad:", err));
  }, [zona]);

  if (!data) return <p>Cargando actividad...</p>;

  return (
    <div className="zona-actividad-chart">
      <h4>Anuncios publicados por mes</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value) => `${value} anuncios`} />
          <Bar dataKey="anuncios" fill="#3498db" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ZonaActividadChart;
