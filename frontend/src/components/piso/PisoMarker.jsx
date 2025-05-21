import React, { useRef } from 'react';
import {
    getPriceColor,
    getValorColor,
    getAgencyColor,
    getOcupacionColor,
    getDensityColor
} from '../../utils/colorUtils';
import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { color_por_zona } from '../../data/zonas';
const PisoMarker = React.memo(({
    piso,
    isSelected,
    isComparing,
    isSimilar,
    offset,
    showCompareTooltips,
    showSimilarTooltips,
    selectedAgency,
    priceScale,
    valorScale,
    viewMode,
    zoneCounts,
    maxZoneCount,
    onMarkerClick,
    similar,
    comparing,
    pisos
  }) => {
    const markerRef = useRef(null);
  
    // Define adjusted position
    const adjustedPosition = [
      piso.latitud + offset.lat,
      piso.longitud + offset.lng
    ];
  
    // Define color based on viewMode
    let color;
    if (viewMode === 'zona') {
      color = color_por_zona[piso.zona] || 'gray';
    } else if (viewMode === 'precio') {
      color = getPriceColor(piso.precio, priceScale);
    } else if (viewMode === 'valoracion') {
      color = getValorColor(piso.valoracion_score ?? 0, valorScale);
    } else if (viewMode === 'vendedor') {
      color = getAgencyColor(piso.anunciante);
    } else if (viewMode === 'ocupacion') {
      color = getOcupacionColor(piso.ocupado);
    } else if (viewMode === 'densidad') {
      color = getDensityColor(zoneCounts[piso.zona] || 0, maxZoneCount);
    }
  
    return (
      <>
        <CircleMarker
          center={adjustedPosition}
          radius={isComparing && showCompareTooltips ? 8 : 5}
          ref={markerRef}
          pathOptions={{
            color,
            fillColor: color,
            fillOpacity: isComparing && showCompareTooltips ? 1 : 0.8,
            weight: isSelected || isComparing && showCompareTooltips ? 2 : 1
          }}
          eventHandlers={{
            click: () => onMarkerClick(piso),
            mouseover: () => markerRef.current?.openPopup(),
            mouseout: () => markerRef.current?.closePopup()
          }}
        >
          {/* Aquí puedes mover todos los tooltips y el popup */}
          <Popup autoPan={false} className="dark-popup">
                <div className="marker-popup-content">
                  <div className="popup-header">
                    <h3>{piso.tipo} {piso.metros && `· ${piso.metros} m²`}</h3>
                    {piso.precio_estimado && Math.abs(piso.precio - piso.precio_estimado) / piso.precio_estimado > 0.1 && (
                      <div className={`price-tag ${piso.precio < piso.precio_estimado ? 'bargain' : 'overpriced'}`}>
                        {piso.precio < piso.precio_estimado ? 'GANGA' : 'SOBREPRECIO'}
                      </div>
                    )}
                  </div>
                  
                  <div className="popup-price">
                    <span>{piso.precio.toLocaleString()} €</span>
                    {piso.metros && <span className="price-per-m2">{Math.round(piso.precio / piso.metros).toLocaleString()} €/m²</span>}
                  </div>
                  
                  <div className="popup-details">
                    <div className="detail-item">
                      <span className="detail-label">Zona:</span>
                      <span className="detail-value">{piso.zona}</span>
                    </div>
                    {piso.habitaciones && (
                      <div className="detail-item">
                        <span className="detail-label">Hab:</span>
                        <span className="detail-value">{piso.habitaciones}</span>
                      </div>
                    )}
                    {piso.baños && (
                      <div className="detail-item">
                        <span className="detail-label">Baños:</span>
                        <span className="detail-value">{piso.baños}</span>
                      </div>
                    )}
                    {piso.anunciante && (
                      <div className="detail-item">
                        <span className="detail-label">Agencia:</span>
                        <span className="detail-value">{piso.anunciante}</span>
                      </div>
                    )}
                  </div>
                  
                  {piso.precio_estimado && (
                    <div className="popup-ai-prediction">
                      <div className="ai-label">
                        <span className="ai-icon">🤖</span> Predicción IA:
                      </div>
                      <div className="ai-value">{Math.round(piso.precio_estimado).toLocaleString()} €</div>
                    </div>
                  )}
                  
                  {isComparing && (
                    <div className="popup-badge comparing">
                      ✓ En comparador
                    </div>
                  )}
                  
                  {isSimilar && (
                    <div className="popup-badge similar">
                      ✓ Propiedad similar
                    </div>
                  )}
                </div>
              </Popup>
  
          {isComparing && showCompareTooltips && (
            <Tooltip permanent direction="top" offset={[0, -10]} className="comparing-tooltip">
              {comparing.findIndex(p => p.id === piso.id) + 1}
            </Tooltip>
          )}
  
          {showSimilarTooltips && isSimilar && (
            <Tooltip permanent direction="top" offset={[0, -10]} className="comparing-tooltip">
              {similar.findIndex(p => p.id === piso.id) + 1}
            </Tooltip>
          )}
  
          {selectedAgency && piso.anunciante === selectedAgency && (
            <Tooltip permanent direction="top" offset={[0, -10]} className="comparing-tooltip">
              {
                pisos
                  .filter(p => p.anunciante === selectedAgency)
                  .findIndex(p => p.id === piso.id) + 1
              }
            </Tooltip>
          )}
        </CircleMarker>
  
        {isSelected && (
          <CircleMarker
            center={adjustedPosition}
            radius={20}
            className="pulse-marker"
            pathOptions={{
              color: '#fff',
              fillColor: '#3498db',
              fillOpacity: 0.5,
              weight: 2.5
            }}
          />
        )}
      </>
    );
  });

  export default PisoMarker;
  