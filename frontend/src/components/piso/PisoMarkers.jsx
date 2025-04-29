import React, { useRef, useMemo } from 'react';
import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { color_por_zona } from '../../data/zonas';
import {
    getPriceColor,
    getValorColor,
    getAgencyColor
} from '../../utils/colorUtils';

export default React.memo(function PisoMarkers({
  pisos,
  viewMode,
  selected,
  comparing,
  similar, // Receive similarPisos
  onMarkerClick,
  showCompareTooltips,
  showSimilarTooltips,
  priceScale,
  valorScale,
  selectedAgency,
}) {
  const precios = pisos.map(p => p.precio).sort((a, b) => a - b);
  const min = precios[Math.floor(pisos.length * 0.05)];
  const max = precios[Math.floor(pisos.length * 0.95)];
  const valores = pisos
    .map(p => p.valoracion_score)
    .filter(v => v !== undefined && v !== null);
  const minVal = Math.min(...valores);
  const maxVal = Math.max(...valores);

  const markerRef = useRef({});
  
  // Create a map of coordinates to count how many properties share the same location
  const coordinateGroups = useMemo(() => {
    const groups = {};
    const offsetMap = {};
    
    // Group pisos by their coordinates
    pisos.forEach(piso => {
      const coordKey = `${piso.latitud},${piso.longitud}`;
      if (!groups[coordKey]) {
        groups[coordKey] = [];
      }
      groups[coordKey].push(piso.id);
    });
    
    // Calculate offsets for each piso
    Object.entries(groups).forEach(([coordKey, pisoIds]) => {
      if (pisoIds.length > 1) {
        // If multiple pisos share coordinates, create a random spread
        pisoIds.forEach((id) => {
          // Generate random offsets within a small area
          // Using a consistent seed based on ID to ensure the same piso always gets the same offset
          const seed = id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
          const rng1 = Math.sin(seed) * 10000;
          const rng2 = Math.cos(seed) * 10000;
          
          // Random offset between -0.0008 and 0.0008 (about 50-80 meters)
          const maxRadius = 0.0009;
          offsetMap[id] = {
            lat: ((rng1 % 1) - 0.5) * maxRadius,
            lng: ((rng2 % 1) - 0.5) * maxRadius
          };
        });
      } else {
        // Single piso at this location, no offset needed
        offsetMap[pisoIds[0]] = { lat: 0, lng: 0 };
      }
    });
    
    return offsetMap;
  }, [pisos]);

  return (
    <>
      {pisos.map(piso => {
        const isSelected = selected?.id === piso.id;
        const isComparing = comparing.some(p => p.id === piso.id);
        const isSimilar = similar.some(p => p.id === piso.id); // Check if piso is similar
        let color;

        if (viewMode === 'zona') {
            color = color_por_zona[piso.zona] || 'gray';
        } else if (viewMode === 'precio') {
            color = getPriceColor(piso.precio, priceScale);
        } else if (viewMode === 'valoracion') {
            color = getValorColor(piso.valoracion_score ?? 0, valorScale);
        } else if (viewMode === 'vendedor') {
            color = getAgencyColor(piso.anunciante);
        }
        
        // Apply offset to coordinates if needed
        const offset = coordinateGroups[piso.id] || { lat: 0, lng: 0 };
        const adjustedPosition = [
          piso.latitud + offset.lat,
          piso.longitud + offset.lng
        ];

        return (
          <React.Fragment key={piso.id}>
            <CircleMarker
              center={adjustedPosition}
              radius={isComparing && showCompareTooltips ? 8 : 5}
              ref={(el) => {
                if (el) markerRef.current[piso.id] = el;
              }}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: isComparing && showCompareTooltips ? 1 : 0.8,
                weight: isSelected || isComparing && showCompareTooltips ? 2 : 1
              }}
              eventHandlers={{
                click: () => onMarkerClick(piso),
                mouseover: () => markerRef.current[piso.id]?.openPopup(),
                mouseout: () => markerRef.current[piso.id]?.closePopup()
              }}
            >
              <Popup>
                <b>{piso.tipo}</b>
                <br />Zona: {piso.zona}
                <br />Precio: {piso.precio.toLocaleString()} €
                {isComparing && (
                  <><br />✓ En comparador</>
                )}
              </Popup>
              {isComparing && showCompareTooltips &&  (
                <Tooltip permanent direction="top" offset={[0, -10]} className="comparing-tooltip">
                  {comparing.findIndex(p => p.id === piso.id) + 1}
                </Tooltip>
              )}
              {isSimilar && showSimilarTooltips &&  (
                <Tooltip permanent direction="top" offset={[0, -10]} className="comparing-tooltip">
                  {similar.findIndex(p => p.id === piso.id) + 1}
                </Tooltip>
              )}
              {selectedAgency && piso.anunciante === selectedAgency && (
                    <Tooltip
                        permanent
                        direction="top"
                        offset={[0, -10]}
                        className="comparing-tooltip"
                    >
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
          </React.Fragment>
        );
      })}
    </>
  );
});
