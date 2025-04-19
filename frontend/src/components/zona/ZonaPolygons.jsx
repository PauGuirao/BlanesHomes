import React from 'react';
import { Polygon } from 'react-leaflet';
import { color_por_zona } from '../../data/zonas';

export default function ZonaPolygons({ zonas, selectedZona, onZoneClick }) {
  return (
    <>
      {Object.entries(zonas).map(([nombre, coords]) => {
        const isSelected = selectedZona === nombre;
        return (
          <Polygon
            key={nombre}
            positions={coords}
            pathOptions={{
              color: color_por_zona[nombre],
              fillOpacity: isSelected ? 0.25 : 0.15,
              weight: isSelected ? 2 : 1,
            }}
            eventHandlers={{ click: () => onZoneClick(nombre, coords) }}
          />
        );
      })}
    </>
  );
}