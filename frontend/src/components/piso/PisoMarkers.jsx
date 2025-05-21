import React, { useRef, useMemo } from 'react';
import PisoMarker from './PisoMarker';
import './PisoMarkers.css'; // Import the CSS file

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

  const zoneCounts = useMemo(() => {
    const counts = {};
    pisos.forEach(piso => {
      if (!counts[piso.zona]) {
        counts[piso.zona] = 0;
      }
      counts[piso.zona]++;
    });
    return counts;
  }, [pisos]);
  
  // Calculate the maximum count for any zone
  const maxZoneCount = useMemo(() => {
    return Math.max(...Object.values(zoneCounts));
  }, [zoneCounts]);

  return (
    <>
      {pisos.map(piso => (
        <PisoMarker
          key={piso.id}
          piso={piso}
          isSelected={selected?.id === piso.id}
          isComparing={comparing.some(p => p.id === piso.id)}
          isSimilar={similar.some(p => p.id === piso.id)}
          offset={coordinateGroups[piso.id] || { lat: 0, lng: 0 }}
          showCompareTooltips={showCompareTooltips}
          showSimilarTooltips={showSimilarTooltips}
          selectedAgency={selectedAgency}
          priceScale={priceScale}
          valorScale={valorScale}
          viewMode={viewMode}
          zoneCounts={zoneCounts}
          maxZoneCount={maxZoneCount}
          onMarkerClick={onMarkerClick}
          similar={similar}
          comparing={comparing}
          pisos={pisos}
        />
      ))}
    </>
  );
});
