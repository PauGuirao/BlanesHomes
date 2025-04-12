import "./Sidebar.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import HipotecaTab from "./HipotecaTab"; // Asegúrate de que la ruta sea correcta
import RecomendadosTab from "./RecomendadosTab";

const Sidebar = ({ piso, onClose }) => {
  if (!piso) return null;
  const [recomendados, setRecomendados] = useState([]);
  const [tab, setTab] = useState("compra"); // por defecto la tab dinámica
  useEffect(() => {
    if (piso) {
      setTab("compra");
      axios
        .post(`http://localhost:8000/recomendaciones?id=${piso.id}`) // ajusta el parámetro si es necesario
        .then((res) => setRecomendados(res.data))
        .catch((err) => console.error("Error al cargar recomendaciones", err));
    }
  }, [piso]);

  return (
    <div className="sidebar">
      <h2> {piso.tipo}</h2>
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

      <div className="sidebar-estimacion">
        <div className="ia-label">🤖 Nuestra IA estima:</div>
        <div className="estimado-precio">
          {piso.precio_estimado.toLocaleString()} €
        </div>
      </div>

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
          📈 Inversión
        </button>
        <button
          className={tab === "similares" ? "active" : ""}
          onClick={() => setTab("similares")}
        >
          🔍 Similares
        </button>
      </div>
      {tab === "compra" && <HipotecaTab precio={piso.precio} />}
      {recomendados.length > 0 && tab === "inversion" && (
        <RecomendadosTab recomendados={recomendados} />
      )}
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
};

// 💸 Hipoteca mensual estimada
function calcularCuota(prestamo, interesAnual, años) {
  const mensual = interesAnual / 100 / 12;
  const n = años * 12;
  return (prestamo * mensual) / (1 - Math.pow(1 + mensual, -n));
}

export default Sidebar;
