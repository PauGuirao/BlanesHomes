import React, { useState, useEffect } from "react";
import "./ParticularesView.css";

function ParticularSideView({ session, pisos, onPisoClick }) {
  const [loading, setLoading] = useState(true);
  const [particularesPisos, setParticularesPisos] = useState([]);
  const [filteredPisos, setFilteredPisos] = useState([]);
  const [filters, setFilters] = useState({
    zona: "",
    precioMin: "",
    precioMax: "",
    metrosMin: "",
    metrosMax: "",
    habitacionesMin: "",
  });

  // Filter pisos to only include those from particulares
  useEffect(() => {
    if (pisos && pisos.length > 0) {
      const pisosParticulares = pisos.filter(piso => 
        piso.anunciante && piso.anunciante.toLowerCase().includes('particular')
      );
      setParticularesPisos(pisosParticulares);
      setFilteredPisos(pisosParticulares);
      setLoading(false);
    } else {
      setParticularesPisos([]);
      setFilteredPisos([]);
      setLoading(false);
    }
  }, [pisos]);

  useEffect(() => {
    // Apply filters
    let result = [...particularesPisos];
    
    if (filters.zona) {
      result = result.filter(piso => piso.zona === filters.zona);
    }
    
    if (filters.precioMin) {
      result = result.filter(piso => piso.precio >= parseInt(filters.precioMin));
    }
    
    if (filters.precioMax) {
      result = result.filter(piso => piso.precio <= parseInt(filters.precioMax));
    }
    
    if (filters.metrosMin) {
      result = result.filter(piso => piso.metros >= parseInt(filters.metrosMin));
    }
    
    if (filters.metrosMax) {
      result = result.filter(piso => piso.metros <= parseInt(filters.metrosMax));
    }
    
    if (filters.habitacionesMin) {
      result = result.filter(piso => piso.habitaciones >= parseInt(filters.habitacionesMin));
    }
    
    setFilteredPisos(result);
  }, [filters, particularesPisos]);

  // Get unique zones for filter dropdown
  const zonas = [...new Set(particularesPisos.map(piso => piso.zona))];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const resetFilters = () => {
    setFilters({
      zona: "",
      precioMin: "",
      precioMax: "",
      metrosMin: "",
      metrosMax: "",
      habitacionesMin: "",
    });
  };

  return (
    <div className="particulares-view">
      <div className="particulares-header">
        <h2>Propiedades de Particulares</h2>
        <p className="particulares-description">
          Estas propiedades están gestionadas directamente por sus propietarios. 
          Como agencia, puedes contactar con ellos para ofrecer tus servicios.
        </p>
      </div>

      <div className="particulares-filters">
        <div className="filter-group">
          <label>Zona</label>
          <select 
            name="zona" 
            value={filters.zona} 
            onChange={handleFilterChange}
          >
            <option value="">Todas las zonas</option>
            {zonas.map(zona => (
              <option key={zona} value={zona}>{zona}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Precio</label>
          <div className="range-inputs">
            <input 
              type="number" 
              name="precioMin" 
              placeholder="Min €" 
              value={filters.precioMin} 
              onChange={handleFilterChange}
            />
            <span>-</span>
            <input 
              type="number" 
              name="precioMax" 
              placeholder="Max €" 
              value={filters.precioMax} 
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Metros</label>
          <div className="range-inputs">
            <input 
              type="number" 
              name="metrosMin" 
              placeholder="Min m²" 
              value={filters.metrosMin} 
              onChange={handleFilterChange}
            />
            <span>-</span>
            <input 
              type="number" 
              name="metrosMax" 
              placeholder="Max m²" 
              value={filters.metrosMax} 
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Habitaciones</label>
          <input 
            type="number" 
            name="habitacionesMin" 
            placeholder="Min" 
            value={filters.habitacionesMin} 
            onChange={handleFilterChange}
          />
        </div>

        <button className="reset-filters" onClick={resetFilters}>
          Resetear filtros
        </button>
      </div>

      {loading ? (
        <div className="loading-message">Cargando propiedades...</div>
      ) : (
        <>
          <div className="results-count">
            {filteredPisos.length} propiedades encontradas
          </div>
          
          <div className="particulares-grid">
            {filteredPisos.map(piso => (
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
                      {piso.dias_publicado} días en el mercado
                    </div>
                    <button className="contact-button">Contactar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredPisos.length === 0 && (
            <div className="no-results">
              No se encontraron propiedades con los filtros seleccionados
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ParticularSideView;