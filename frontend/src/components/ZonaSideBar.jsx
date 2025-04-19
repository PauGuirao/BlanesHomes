import React, { useState, useEffect } from "react";
import ZonaTrends from "./ZonaTrends";
import "./ZonaSideBar.css";
import PropertiesList from "./PropertiesList";
import ZonaGangas from "./ZonaGangas";

function ZonaSidebar({ zona, pisos, onClose, onPisoClick }) {
  if (!zona) return null;

  const [zonaStats, setZonaStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // Add this state

  useEffect(() => {
    setLoadingStats(true);
    fetch(`http://localhost:8000/zona?id=${encodeURIComponent(zona)}`)
      .then((res) => res.json())
      .then((data) => {
        setZonaStats(data);
        setLoadingStats(false);
      })
      .catch((error) => {
        console.error("Error cargando estadísticas:", error);
        setLoadingStats(false);
      });
  }, [zona]);

  const pisosZona = pisos.filter((p) => p.zona === zona);

  return (
    <div className="zona-sidebar">
      <h2>
        📊 <strong>{zona}</strong>
      </h2>

      <div className="zona-tabs">
        <button
          className={`zona-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          General
        </button>
        <button
          className={`zona-tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Datos
        </button>
        <button
          className={`zona-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Lista ({pisosZona.length})
        </button>
      </div>

      {loadingStats ? (
        <p>Cargando estadísticas...</p>
      ) : zonaStats ? (
        <>
          {activeTab === 'stats' && (
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
              <h3>Tipos de vivienda</h3>
                <ZonaGangas zona={zona} onPisoClick={onPisoClick} />
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <ZonaTrends zonaStats={zonaStats} zona={zona} />
          )}

          {activeTab === 'properties' && (
            <PropertiesList pisos={pisosZona} onPisoClick={onPisoClick} />
          )}
        </>
      ) : (
        <p>No hay estadísticas disponibles para esta zona.</p>
      )}
    </div>
  );
}

export default ZonaSidebar;
