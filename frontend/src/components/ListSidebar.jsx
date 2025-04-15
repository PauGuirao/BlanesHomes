import React, { useState, useMemo } from "react";
import FilterBlock from "./FilterBlock";
import "./ListSidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

const ListSidebar = ({ pisos, viewMode, color_por_zona, min = 20000, max = 5000000, onClose, onPisoClick }) => {
  const [showFilters, setShowFilters] = useState(false);

  const initialFilters = {
    priceRange: [min, max],
    habitaciones: "",
    banos: "",
    metros: "",
    minPrice: min,
    maxPrice: max
  };

  const [filters, setFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    setShowFilters(false); // Close filter block after applying filters
  };

  // 🔍 Criterios generalizados para aplicar filtros
  const filterCriteria = [
    { key: "habitaciones", compare: (piso, val) => piso.habitaciones >= Number(val) },
    { key: "banos", compare: (piso, val) => piso.baños >= Number(val) },
    { key: "metros", compare: (piso, val) => piso.metros >= Number(val) }
  ];

  // 🧠 Filtrado optimizado con useMemo
  const filteredPisos = useMemo(() => {
    const filtered = pisos.filter(piso => {
      const inPriceRange =
        piso.precio >= activeFilters.priceRange[0] &&
        piso.precio <= activeFilters.priceRange[1];

      const matchesAll = filterCriteria.every(({ key, compare }) => {
        const val = activeFilters[key];
        return !val || compare(piso, val);
      });

      return inPriceRange && matchesAll;
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      if (viewMode === "zona") {
        return a.zona.localeCompare(b.zona);
      } else if (viewMode === "precio") {
        return a.precio - b.precio;
      } else if (viewMode === "valoracion") {
        return (b.valoracion_score || 0) - (a.valoracion_score || 0);
      }
      return 0;
    });
  }, [pisos, activeFilters, viewMode]); // Add viewMode to dependencies

  const hasActiveFilters = useMemo(() => {
    return activeFilters.habitaciones !== "" ||
           activeFilters.banos !== "" ||
           activeFilters.metros !== "" ||
           activeFilters.priceRange[0] !== min ||
           activeFilters.priceRange[1] !== max;
  }, [activeFilters, min, max]);

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setActiveFilters(initialFilters);
  };

  return (
    <div className="list-sidebar">
      <div className="list-header">
        <h2>Propiedades en Blanes</h2>
        <div className="filter-buttons">
            <button 
                className={`filter-icon-button ${hasActiveFilters ? 'has-filters' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
            >
            <FontAwesomeIcon icon={faFilter} />
          </button>
        </div>
      </div>

      {showFilters && (
        <FilterBlock 
          filters={filters}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      )}

      <div className="list-info">
        <div className="list-subtitle">
          Ordenado por {viewMode === "zona" ? "zona" : viewMode === "precio" ? "precio" : "valoración"}
        </div>
        <div className="results-count">
          <span className="results-number">{filteredPisos.length}</span> propiedades
        </div>
      </div>

      <div className="pisos-list">
        {filteredPisos.map((piso, index) => (
          <div key={index} className="piso-item" onClick={() => onPisoClick(piso)}>
            <div
              className="piso-color"
              style={{
                backgroundColor:
                  viewMode === "zona"
                    ? color_por_zona[piso.zona] || "gray"
                    : "#3498db"
              }}
            ></div>
            <div className="piso-info">
              <div className="piso-tipo">{piso.tipo}</div>
              <div className="piso-zona">Zona: {piso.zona}</div>
              <div className="piso-details">
                <span>
                  {piso.metros}m² • {piso.habitaciones} hab • {piso.baños} baños
                </span>
                <span className="piso-precio">{piso.precio.toLocaleString()}€</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListSidebar;
