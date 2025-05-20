import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ZonaTrends from "./ZonaTrends";
import "./ZonaSideBar.css";
import PropertiesList from "../PropertiesList";
import ZonaGangas from "./ZonaGangas";
import ZonaAgencyData from "./ZonaAgencyData";

function ZonaSidebar({ zona, pisos, onClose, onSugerenciaClick, session }) {
  if (!zona) return null;

  const API_URL = import.meta.env.VITE_API_URL;
  const [activeTab, setActiveTab] = useState('stats');

  // ✅ Load zona stats using React Query
  const {
    data: zonaStats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["zonaStats", zona],
    queryFn: () =>
      fetch(`${API_URL}/zona?id=${encodeURIComponent(zona)}`).then((res) =>
        res.json()
      ),
    enabled: !!zona, // only run if zona is defined
    staleTime: 1000 * 60 * 60 * 6, // 6h cache (adjust as needed)
  });

  const pisosZona = pisos.filter((p) => p.zona === zona);

  return (
    <div className="zona-sidebar">
      <h2>
        📊 <strong>{zona}</strong>
      </h2>

      <div className="zona-tabs">
        {["stats", "agency", "trends", "properties"].map((tab) => (
          <button
            key={tab}
            className={`zona-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "stats" && "General"}
            {tab === "agency" && "Agency"}
            {tab === "trends" && "Datos"}
            {tab === "properties" && `Lista (${pisosZona.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>Cargando estadísticas...</p>
      ) : isError ? (
        <p>Error al cargar estadísticas.</p>
      ) : zonaStats ? (
        <>
          {activeTab === "stats" && (
            <div className="zona-stats">
              <div className="stat-group">
                <h3>Datos generales</h3>
                <div className="stat-item">
                  <span>🏠 Total propiedades:</span>
                  <span>{zonaStats.total_propiedades}</span>
                </div>
                <div className="stat-item">
                  <span>💰 Precio medio:</span>
                  <span>{zonaStats.precio_medio.toLocaleString()} €</span>
                </div>
                <div className="stat-item">
                  <span>📏 Tamaño medio:</span>
                  <span>{zonaStats.metros_medio} m²</span>
                </div>
                <div className="stat-item">
                  <span>💶 Precio/m²:</span>
                  <span>{zonaStats.precio_m2.toLocaleString()} €/m²</span>
                </div>
                <div className="stat-item">
                  <span>⏳ Tiempo medio en venta:</span>
                  <span>{zonaStats.tiempo_medio_venta} días</span>
                </div>
              </div>

              <div className="stat-group">
                <h3>Tipos de vivienda</h3>
                {Object.entries(zonaStats.tipos).map(([tipo, porcentaje]) => (
                  <div className="stat-item" key={tipo}>
                    <span>{tipo}:</span>
                    <span>{porcentaje}%</span>
                  </div>
                ))}
              </div>

              <div className="stat-group">
                <h3>Oportunidades</h3>
                <ZonaGangas zona={zona} onPisoClick={onSugerenciaClick} />
              </div>
            </div>
          )}

          {activeTab === "trends" && (
            <ZonaTrends zonaStats={zonaStats} zona={zona} />
          )}

          {activeTab === "properties" && (
            <PropertiesList
              pisos={pisosZona}
              onPisoClick={onSugerenciaClick}
            />
          )}

          {activeTab === "agency" && (
            <ZonaAgencyData
              pisos={pisosZona}
              onPisoClick={onSugerenciaClick}
              session={session}
              zona={zona}
              zonaStats={zonaStats}
            />
          )}
        </>
      ) : (
        <p>No hay estadísticas disponibles para esta zona.</p>
      )}
    </div>
  );
}

export default ZonaSidebar;
