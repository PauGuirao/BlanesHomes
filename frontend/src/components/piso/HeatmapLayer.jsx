import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { useMap } from 'react-leaflet';

const HeatmapLayer = ({ pisos, intensity = 10, radius = 25, blur = 15 }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!pisos || pisos.length === 0) return;
    
    // Convert pisos to heatmap points [lat, lng, intensity]
    const points = pisos.map(piso => [
      piso.latitud,
      piso.longitud,
      intensity // You can adjust this value based on property attributes
    ]);
    
    // Create the heat layer
    const heatLayer = L.heatLayer(points, {
      radius,
      blur,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.65: 'lime', 0.85: 'yellow', 1.0: 'red' }
    });
    
    // Add the layer to the map
    heatLayer.addTo(map);
    
    // Cleanup function
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, pisos, intensity, radius, blur]);
  
  return null;
};

export default HeatmapLayer;