// src/components/map/MapView.jsx
import React, { useMemo, Suspense, useRef, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import ZonaPolygons from "../zona/ZonaPolygons";
import PisoMarkers from "../piso/PisoMarkers";
import Legend from "../Legend";
import MapClickReset from "../MapClickReset";
import MapCenter from "../MapCenter";
import HeatmapLayer from "../piso/HeatmapLayer";

const MapView = (props) => {
  const  {
    centro,
    pisos,
    filteredPisos,
    cityZonas,
    zonaSeleccionada,
    centroZona,
    onZoneClick,
    viewMode,
    pisoSeleccionado,
    comparePisos,
    similarPisos,
    priceScale,
    valorScale,
    selectedAgency,
    color_por_zona,
    min,
    max,
    minValoracion,
    maxValoracion,
    onOutsideClick,
    mapRef,
    mapPisos,
    onMarkerClick,
    showZonaCenter,
    showPisoCenter,
    showCompareCenter,
    showCompareTooltips,
    showSimilarTooltips
  } = props;
  const prevProps = useRef();

  useEffect(() => {
    if (!prevProps.current) {
      prevProps.current = props;
      return;
    }
  
    Object.entries(props).forEach(([key, value]) => {
      const prevValue = prevProps.current[key];
  
      if (value !== prevValue) {
        console.log(`[MapView] prop '${key}' cambió`);
        console.log("  🔁 Anterior:", prevValue);
        console.log("  🔁 Actual:  ", value);
  
        // Extra: para arrays u objetos grandes, puedes mostrar diferencias más visibles:
        if (Array.isArray(value) && Array.isArray(prevValue)) {
          console.log(`  🔍 Longitud antes: ${prevValue.length}, ahora: ${value.length}`);
          console.log(`  🔍 Igual por JSON: ${JSON.stringify(prevValue) === JSON.stringify(value)}`);
        }
      }
    });
  
    prevProps.current = props;
  }, [props]);

  console.log("[MapView] Renderizado");
  return (
    <MapContainer
      key={centro.join(",")} // fuerza reconstrucción solo cuando cambia el centro
      center={centro}
      
      zoom={14}
      minZoom={13}
      maxZoom={16}
      ref={mapRef}
      style={{ height: "calc(100vh - 60px)", width: "100vw" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <Suspense fallback={null}>
        {cityZonas && (
          <ZonaPolygons
            zonas={cityZonas}
            selectedZona={zonaSeleccionada}
            onZoneClick={onZoneClick}
          />
        )}

        {viewMode === "densidad" ? (
          <HeatmapLayer pisos={filteredPisos} intensity={3} radius={25} blur={15} />
        ) : (
          <PisoMarkers
            pisos={mapPisos}
            viewMode={viewMode}
            selected={pisoSeleccionado}
            comparing={comparePisos}
            similar={similarPisos}
            showCompareTooltips={showCompareTooltips}
            showSimilarTooltips={showSimilarTooltips}
            priceScale={priceScale}
            valorScale={valorScale}
            selectedAgency={selectedAgency}
            onMarkerClick={onMarkerClick}
          />
        )}
      </Suspense>

      <Legend
        viewMode={viewMode}
        color_por_zona={color_por_zona}
        min={viewMode === "valoracion" ? minValoracion : min}
        max={viewMode === "valoracion" ? maxValoracion : max}
        pisos={pisos}
        colorScale={viewMode === "valoracion" ? valorScale : priceScale}
      />

      <MapClickReset
        zonaSeleccionada={zonaSeleccionada}
        onOutsideClick={onOutsideClick}
      />

      {/* Movimientos automáticos de cámara */}
      {showZonaCenter && (
        <MapCenter center={centroZona} zoom={15} animate={true} />
      )}
      {showPisoCenter && (
        <MapCenter
          center={[pisoSeleccionado.latitud, pisoSeleccionado.longitud]}
          zoom={14}
          offset={[150, 0]}
          animate={true}
        />
      )}
      {showCompareCenter && (
        <MapCenter
          bounds={comparePisos.map(p => [p.latitud, p.longitud])}
          padding={[50, 50]}
          animate={true}
        />
      )}
    </MapContainer>
  );
};

export default React.memo(MapView);
