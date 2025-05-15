import React, { useState, useMemo } from "react";
import FilterBlock from "./FilterBlock";
import "./ListSidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next'; // Add translation import
import {
  createPriceScale, 
  createValorScale,
  getPriceColor,
  getValorColor,
  getAgencyColor,
  getOcupacionColor,
  getDensityColor
} from '../utils/colorUtils';

const ListSidebar = ({ pisos, viewMode, color_por_zona, min = 20000, max = 5000000, onClose, onPisoClick, filteredPisos, onFilterChange }) => {
  const { t } = useTranslation(); // Add translation hook
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
    const nuevaLista = pisos.filter(piso => {
      const [minP, maxP] = filters.priceRange;
      if (piso.precio < minP || piso.precio > maxP) return false;
      if (filters.habitaciones && piso.habitaciones < Number(filters.habitaciones)) return false;
      if (filters.banos && piso.baños < Number(filters.banos)) return false;
      if (filters.metros && piso.metros < Number(filters.metros)) return false;
      return true;
    });
  
    setActiveFilters(filters);
    setShowFilters(false);
    onFilterChange(nuevaLista); // ← lo manda a App.jsx
  };

  // 🔍 Criterios generalizados para aplicar filtros
  const filterCriteria = [
    { key: "habitaciones", compare: (piso, val) => piso.habitaciones >= Number(val) },
    { key: "banos", compare: (piso, val) => piso.baños >= Number(val) },
    { key: "metros", compare: (piso, val) => piso.metros >= Number(val) }
  ];

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

  // Organize properties based on viewMode
  const organizedPisos = useMemo(() => {
    let organized = [...filteredPisos];
    
    if (viewMode === "zona") {
      // Group by zone and sort alphabetically by zone
      organized.sort((a, b) => a.zona.localeCompare(b.zona));
    } else if (viewMode === "precio") {
      // Sort by price (ascending)
      organized.sort((a, b) => a.precio - b.precio);
    } else if (viewMode === "valoracion") {
      // Sort by transformed rating (ascending - lower scores at top)
      organized.sort((a, b) => {
        const scoreA = Math.max(0, Math.min(10, 7 - ((a.valoracion_score || 0) * 10)));
        const scoreB = Math.max(0, Math.min(10, 7 - ((b.valoracion_score || 0) * 10)));
        return scoreB - scoreA; // Ascending order (lower scores first)
      });
    } else if (viewMode === "vendedor") {
      // Group by agency and sort by agency name
      organized.sort((a, b) => {
        const agencyA = a.anunciante || "Sin agencia";
        const agencyB = b.anunciante || "Sin agencia";
        return agencyA.localeCompare(agencyB);
      });
    } else if (viewMode === "ocupacion") {
      // Group by occupancy status (occupied first)
      organized.sort((a, b) => {
        if (a.ocupado === b.ocupado) return 0;
        return a.ocupado ? -1 : 1; // Occupied properties first
      });
    } else if (viewMode === "densidad") {
      // For density view, we'll group by zones and count properties
      organized.sort((a, b) => a.zona.localeCompare(b.zona));
    }
    
    return organized;
  }, [filteredPisos, viewMode]);
  
  // Update the groupedPisos useMemo to include the new view mode
  const groupedPisos = useMemo(() => {
    if (viewMode !== "zona" && viewMode !== "vendedor" && viewMode !== "ocupacion" && viewMode !== "densidad") {
      return null; // No grouping for price and rating views
    }
    
    const groups = {};
    
    organizedPisos.forEach(piso => {
      let groupKey;
      if (viewMode === "zona" || viewMode === "densidad") {
        groupKey = piso.zona;
      } else if (viewMode === "vendedor") {
        groupKey = piso.anunciante || "Sin agencia";
      } else if (viewMode === "ocupacion") {
        groupKey = piso.ocupado ? "Ocupado" : "Disponible";
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(piso);
    });

    if (viewMode === "vendedor") {
      // Convert to array, sort, and convert back to object
      const sortedEntries = Object.entries(groups).sort((a, b) => {
        // Sort by number of properties (descending)
        return b[1].length - a[1].length;
      });
      
      // Rebuild the groups object with the sorted entries
      const sortedGroups = {};
      sortedEntries.forEach(([key, value]) => {
        sortedGroups[key] = value;
      });
      
      return sortedGroups;
    } else if (viewMode === "densidad") {
      // Sort zones by number of properties (descending)
      const sortedEntries = Object.entries(groups).sort((a, b) => {
        return b[1].length - a[1].length;
      });
      
      const sortedGroups = {};
      sortedEntries.forEach(([key, value]) => {
        sortedGroups[key] = value;
      });
      
      return sortedGroups;
    }
    
    return groups;
  }, [organizedPisos, viewMode]);

  // Create color scales for price and valoracion
  const priceScale = useMemo(() => createPriceScale(filteredPisos.map(p => p.precio)), [filteredPisos]);
  const valorScale = useMemo(() => createValorScale(filteredPisos.map(p => p.valoracion_score || 0)), [filteredPisos]);

  return (
    <div className="list-sidebar">
      <div className="list-header">
        <h2>{t('listSidebar.propertiesInBlanes', 'Propiedades en Blanes')}</h2>
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
          {t('listSidebar.sortedBy', 'Ordenado por')} {
            viewMode === "zona" ? t('listSidebar.zone', 'zona') : 
            viewMode === "precio" ? t('listSidebar.price', 'precio') : 
            viewMode === "valoracion" ? t('listSidebar.rating', 'valoración') : 
            viewMode === "ocupacion" ? t('listSidebar.occupancy', 'ocupación') :
            viewMode === "densidad" ? t('listSidebar.adDensity', 'densidad de anuncios') :
            t('listSidebar.agency', 'agencia')
          }
        </div>
        <div className="results-count">
          <span className="results-number">{filteredPisos.length}</span> {t('listSidebar.properties', 'propiedades')}
        </div>
      </div>

      <div className="pisos-list">
        {/* Render grouped properties */}
        {(viewMode === "zona" || viewMode === "vendedor" || viewMode === "ocupacion" || viewMode === "densidad") && groupedPisos && 
          Object.entries(groupedPisos).map(([groupName, groupPisos]) => {
            // Calculate max count for density view (used for color scaling)
            const maxCount = viewMode === "densidad" 
              ? Math.max(...Object.values(groupedPisos).map(group => group.length))
              : 0;
              
            // Translate occupancy status
            const translatedGroupName = viewMode === "ocupacion" 
              ? (groupName === "Ocupado" ? t('listSidebar.occupied', 'Ocupado') : t('listSidebar.available', 'Disponible'))
              : viewMode === "zona" || viewMode === "densidad" 
                ? t(`zones.${groupName}`, groupName)
                : groupName;
              
            return (
              <div key={groupName} className="piso-group">
                <div className="group-header" style={{
                  backgroundColor: viewMode === "zona" 
                    ? color_por_zona[groupName] || "gray" 
                    : viewMode === "ocupacion"
                      ? getOcupacionColor(groupName === "Ocupado")
                      : viewMode === "densidad"
                        ? getDensityColor(groupPisos.length, maxCount)
                        : getAgencyColor(groupName)
                }}>
                  {translatedGroupName} <span className="group-count">({groupPisos.length})</span>
                  {viewMode === "densidad" && (
                    <div className="density-bar" style={{ width: `${(groupPisos.length / maxCount) * 100}%` }}></div>
                  )}
                </div>
                {groupPisos.map((piso, index) => (
                  <div key={index} className="piso-item" onClick={() => onPisoClick(piso)}>
                    <div
                      className="piso-color"
                      style={{
                        backgroundColor: viewMode === "zona"
                          ? color_por_zona[piso.zona] || "gray"
                          : viewMode === "ocupacion"
                            ? getOcupacionColor(piso.ocupado)
                            : viewMode === "densidad"
                              ? getDensityColor(groupedPisos[piso.zona]?.length || 0, maxCount)
                              : getAgencyColor(piso.anunciante || "Sin agencia")
                      }}
                    ></div>
                    <div className="piso-info">
                      <div className="piso-tipo">{t(`propertyTypes.${piso.tipo}`, piso.tipo)}</div>
                      {viewMode !== "zona" && viewMode !== "densidad" && 
                        <div className="piso-zona">{t('listSidebar.zone', 'Zona')}: {t(`zones.${piso.zona}`, piso.zona)}</div>
                      }
                      {viewMode !== "vendedor" && piso.anunciante && 
                        <div className="piso-agencia">{piso.anunciante}</div>
                      }
                      <div className="piso-details">
                        <span>
                          {piso.metros}m² • {piso.habitaciones} {t('listSidebar.roomsShort', 'hab')} • {piso.baños} {t('listSidebar.bathsShort', 'baños')}
                        </span>
                        <span className="piso-precio">{piso.precio.toLocaleString()}€</span>
                      </div>
                      {viewMode === "valoracion" && piso.valoracion_score && (
                        <div className="piso-valoracion">
                          {t('listSidebar.rating', 'Valoración')}: <span>{(Math.max(0, Math.min(10, 7 - (piso.valoracion_score * 10)))).toFixed(1)}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        }
        
        {/* Render non-grouped properties (for price and rating views) */}
        {viewMode !== "zona" && viewMode !== "vendedor" && viewMode !== "ocupacion" && viewMode !== "densidad" && 
          organizedPisos.map((piso, index) => (
            <div key={index} className="piso-item" onClick={() => onPisoClick(piso)}>
              <div
                className="piso-color"
                style={{
                  backgroundColor: viewMode === "valoracion" 
                    ? getValorColor(piso.valoracion_score || 0, valorScale)
                    : getPriceColor(piso.precio, priceScale)
                }}
              ></div>
              <div className="piso-info">
                <div className="piso-tipo">{t(`propertyTypes.${piso.tipo}`, piso.tipo)}</div>
                <div className="piso-zona">{t('listSidebar.zone', 'Zona')}: {t(`zones.${piso.zona}`, piso.zona)}</div>
                {piso.anunciante && <div className="piso-agencia">{piso.anunciante}</div>}
                <div className="piso-details">
                  <span>
                    {piso.metros}m² • {piso.habitaciones} {t('listSidebar.roomsShort', 'hab')} • {piso.baños} {t('listSidebar.bathsShort', 'baños')}
                  </span>
                  <span className="piso-precio">{piso.precio.toLocaleString()}€</span>
                </div>
                {viewMode === "valoracion" && piso.valoracion_score && (
                  <div className="piso-valoracion">
                    {t('listSidebar.rating', 'Valoración')}: <span>{(Math.max(0, Math.min(10, 7 - (piso.valoracion_score * 10)))).toFixed(1)}/10</span>
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default ListSidebar;
