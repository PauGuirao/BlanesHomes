import React from 'react';
import { Polygon } from 'react-leaflet';
import { color_por_zona } from '../../data/zonas';

export default function ZonaPolygons({ zonas, selectedZona, onZoneClick }) {
  return (
    <>
      {Object.entries(zonas).map(([nombre, geoJsonData]) => {
        const isSelected = selectedZona === geoJsonData.nombre;
        // Extract coordinates from GeoJSON format
        // GeoJSON uses [longitude, latitude] format, but Leaflet expects [latitude, longitude]
        const coordinates = geoJsonData.poligon.coordinates[0].map(coord => [coord[1], coord[0]]);
        
        return (
          <Polygon
            key={geoJsonData.nombre}
            positions={coordinates}
            pathOptions={{
              color: color_por_zona[geoJsonData.nombre],
              fillOpacity: isSelected ? 0.25 : 0.15,
              weight: isSelected ? 2 : 1,
            }}
            eventHandlers={{ click: () => onZoneClick(geoJsonData.nombre, coordinates) }}
          />
        );
      })}
    </>
  );
}