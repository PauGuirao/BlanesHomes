import React, { useState, useEffect } from "react";
import "./ParticularesView.css";

function ParticularSideView({ session, pisos, onPisoClick }) {
  const [loading, setLoading] = useState(true);
  const [particularesPisos, setParticularesPisos] = useState([]);

  // Filter pisos to only include those from particulares
  useEffect(() => {
    if (pisos && pisos.length > 0) {
      const pisosParticulares = pisos.filter(piso => 
        piso.anunciante && piso.anunciante.toLowerCase().includes('particular')
      );
      setParticularesPisos(pisosParticulares);
      setLoading(false);
    } else {
      setParticularesPisos([]);
      setLoading(false);
    }
  }, [pisos]);

  return (
    <div className="particulares-view">
      <div className="particulares-header">
        <h2>Propiedades de Particulares</h2>
        <p className="particulares-description">
          Estas propiedades están gestionadas directamente por sus propietarios. 
          Como agencia, puedes contactar con ellos para ofrecer tus servicios.
        </p>
      </div>

      {loading ? (
        <div className="loading-message">Cargando propiedades...</div>
      ) : (
        <>
          <div className="results-count">
            {particularesPisos.length} propiedades encontradas
          </div>
          
          <div className="particulares-grid">
            {particularesPisos.map(piso => (
              <div 
                key={piso.id} 
                className="particular-card"
                onClick={() => onPisoClick(piso)}
              >
                <div className="particular-card-content">
                  <div className="particular-card-header">
                    <div className="particular-card-title">{piso.tipo} en {piso.zona}</div>
                    <div className="particular-price">{piso.precio.toLocaleString()} €</div>
                  </div>
                  <div className="particular-card-details">
                    <span>{piso.metros} m²</span>
                    <span>{piso.habitaciones} hab</span>
                    <span>{piso.baños} baños</span>
                  </div>
                  <div className="particular-card-extras">
                    {piso.garaje === 1 && <span>🚗</span>}
                    {piso.piscina === 1 && <span>🏊</span>}
                    {piso.terraza === 1 && <span>🏞️</span>}
                    {piso.ascensor === 1 && <span>🔼</span>}
                    {piso.balcon === 1 && <span>🏙️</span>}
                    {piso.aire_acondicionado === 1 && <span>❄️</span>}
                    {piso.jardin === 1 && <span>🌳</span>}
                  </div>
                  <div className="particular-card-footer">
                    <div className="particular-days">
                      {piso.antiguedad_dias} días en el mercado
                    </div>
                    <a 
                      href={piso.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="contact-button"
                    >
                      Contactar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {particularesPisos.length === 0 && (
            <div className="no-results">
              No se encontraron propiedades de particulares
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ParticularSideView;