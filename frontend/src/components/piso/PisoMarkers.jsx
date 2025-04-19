import React, { useRef } from 'react';
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
  onMarkerClick,
  showCompareTooltips,
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

  return (
    <>
      {pisos.map(piso => {
        const isSelected = selected?.id === piso.id;
        const isComparing = comparing.some(p => p.id === piso.id);
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

        return (
          <React.Fragment key={piso.id}>
            <CircleMarker
              center={[piso.latitud, piso.longitud]}
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
              {selectedAgency && piso.anunciante === selectedAgency && (
                    <Tooltip
                        permanent
                        direction="top"
                        offset={[0, -10]}
                        className="comparing-tooltip"
                    >
                        {/* El índice dentro de los pisos filtrados por agencia */}
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
                center={[piso.latitud, piso.longitud]}
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
