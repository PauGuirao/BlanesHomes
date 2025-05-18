import "./Sidebar.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import HipotecaTab from "../HipotecaTab"; // Asegúrate de que la ruta sea correcta
import RecomendadosTab from "../RecomendadosTab";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next'; // Add translation import

const Sidebar = ({ piso, onClose, onCompare }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useTranslation(); // Add translation hook
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
        .post(`${API_URL}/recomendaciones?id=${piso.id}`) // ajusta el parámetro si es necesario
        .then((res) => setRecomendados(res.data))
        .catch((err) => console.error("Error al cargar recomendaciones", err));
    }
  }, [piso]);

  // Capitalize first letter of property type
  const capitalizedType = piso.tipo.charAt(0).toUpperCase() + piso.tipo.slice(1).toLowerCase();
  const formattedTitle = t(`propertyTypes.${piso.tipo}`, capitalizedType);

  return (
    <div className="sidebar">
      <h2>
        {formattedTitle} <span className="zona-subtitle">{t('sidebar.in', 'en')} {t(`zones.${piso.zona}`, piso.zona)}</span>
        {piso.url && (
          <a 
            href={piso.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="idealista-link"
            title={t('sidebar.viewOnIdealista', 'Ver en Idealista')}
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
          </a>
        )}
      </h2>
      <div className="sidebar-section-2">
        <div className="sidebar-attribute">
          <span role="img" aria-label="money">
            💰 <strong> {t('sidebar.price', 'Precio')}:</strong>
          </span>{" "}
          <p>{piso.precio.toLocaleString()} €</p>
        </div>
        <div className="sidebar-attribute">
          <span role="img" aria-label="lightbulb">
            📍 <strong>{t('sidebar.zone', 'Zona')}:</strong>
          </span>{" "}
          <p style={{ fontSize: "14px" }}> {t(`zones.${piso.zona}`, piso.zona)}</p>
        </div>
      </div>

      <div className="sidebar-section-3">
        <div className="sidebar-attribute">
          <span role="img" aria-label="ruler">
            <strong>{t('sidebar.size', 'Metros')}:</strong>
          </span>{" "}
          <p>{piso.metros} m²</p>
        </div>
        <div className="sidebar-attribute">
          <span role="img" aria-label="ruler">
            <strong>{t('sidebar.bedrooms', 'Habitaciones')}:</strong>
          </span>{" "}
          <p>{piso.habitaciones}</p>
        </div>
        <div className="sidebar-attribute">
          <span role="img" aria-label="ruler">
            <strong>{t('sidebar.bathrooms', 'Baños')}:</strong>
          </span>{" "}
          <p>{piso.baños}</p>
        </div>
      </div>

      {/* Extras section - always show */}
      <div className="sidebar-extras">
        <h3>{t('sidebar.extras', 'Extras')}</h3>
        <div className="extras-container">
          {piso.garaje === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="garage">🚗</span>
              <p>{t('extras.garaje', 'Garaje')}</p>
            </div>
          )}
          {piso.piscina === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="pool">🏊</span>
              <p>{t('extras.piscina', 'Piscina')}</p>
            </div>
          )}
          {piso.terraza === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="terrace">🏞️</span>
              <p>{t('extras.terraza', 'Terraza')}</p>
            </div>
          )}
          {piso.ascensor === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="elevator">🔼</span>
              <p>{t('extras.ascensor', 'Ascensor')}</p>
            </div>
          )}
          {piso.balcon === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="balcony">🏙️</span>
              <p>{t('extras.balcon', 'Balcón')}</p>
            </div>
          )}
          {piso.aire_acondicionado === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="ac">❄️</span>
              <p>{t('extras.aire_acondicionado', 'A/C')}</p>
            </div>
          )}
          {piso.jardin === 1 && (
            <div className="extra-item">
              <span role="img" aria-label="garden">🌳</span>
              <p>{t('extras.jardin', 'Jardín')}</p>
            </div>
          )}
          {(piso.n_extras === 0) && (
            <p className="no-extras">{t('sidebar.noExtras', 'No hay extras disponibles para esta propiedad')}</p>
          )}
        </div>
      </div>

      <div className="sidebar-estimacion">
        <div className="ia-label">🤖 {t('sidebar.aiEstimates', 'Nuestra IA estima:')}</div>
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
            <div className="alert-title">{t('sidebar.occupiedProperty', 'Propiedad ocupada')}</div>
            <div className="alert-description">{t('sidebar.occupiedDescription', 'Esta propiedad está actualmente ocupada. Consulta con la agencia para más detalles.')}</div>
          </div>
        </div>
      )}

      {/* Actions block */}
      <div className="sidebar-actions">
        <h3>{t('sidebar.actions', 'Acciones')}</h3>
        <div className="actions-container">
          <button 
            className="action-button compare-action" 
            onClick={() => onCompare(piso)}
          >
            🔍 {t('sidebar.addToComparison', 'Añadir a comparador')}
          </button>
          {/* Future action buttons will go here */}
        </div>
      </div>

      {/* Tabs section with titles */}
      <div className="sidebar-tabs-container">
        <h3>{t('sidebar.tools', 'Herramientas')}</h3>
        <div className="sidebar-tabs">
          <button
            className={tab === "compra" ? "active" : ""}
            onClick={() => setTab("compra")}
          >
            🏦 {t('sidebar.purchase', 'Compra')}
          </button>
          <button
            className={tab === "inversion" ? "active" : ""}
            onClick={() => setTab("inversion")}
          >
            🔍 {t('sidebar.similar', 'Similares')}
          </button>
        </div>
        
        {tab === "compra" && (
          <div className="tab-content">
            <HipotecaTab precio={piso.precio} />
          </div>
        )}
        
        {recomendados.length > 0 && tab === "inversion" && (
          <div className="tab-content">
            <RecomendadosTab recomendados={recomendados} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
