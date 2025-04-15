import { useEffect, useState, useRef } from "react";
import React from "react";
// Styles
import "./App.css";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polygon,
  useMap,
  Tooltip,
} from "react-leaflet";
import { zonas, color_por_zona } from "./data/zonas";
import {
  getColorScale,
  getColor,
  getValoracionColor,
} from "./utils/colorUtils";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Components
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ViewModeSelector from "./components/ViewModeSelector";
import ZonaSidebar from "./components/ZonaSideBar";
import Legend from "./components/Legend";
import FormularioSidebar from "./components/FormularioSidebar";
import PisoForm from "./components/PisoForm";
import ListSidebar from "./components/ListSidebar";
import ComparePanel from "./components/ComparePanel";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

delete L.Icon.Default.prototype._getIconUrl;
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import MapCenter from "./components/MapCenter";
import MapClickReset from "./components/MapClickReset";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Add this custom hook at the top of your component
function MapController() {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      window.map = map; // This allows us to access the map globally
    }
  }, [map]);
  
  return null;
}

function App() {
  const [pisos, setPisos] = useState([]);
  const [viewMode, setViewMode] = useState("zona"); // or "precio"
  const [pisoSeleccionado, setPisoSeleccionado] = useState(null);
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [centroZona, setCentroZona] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarComparator, setMostrarComparator] = useState(false);
  const [mostrarListado, setMostrarListado] = useState(true);
  const [comparePisos, setComparePisos] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    axios.get("http://localhost:8000/pisos").then((res) => {
      setPisos(res.data);
    });
  }, []);

  const centro = [41.672, 2.805]; // centro de Blanes
  const precios = pisos.map((p) => p.precio).sort((a, b) => a - b);
  const min = precios[Math.floor(pisos.length * 0.05)]; // 5th percentile
  const max = precios[Math.floor(pisos.length * 0.95)]; // 95th percentile
  const colorScale = getColorScale(min, max);
  const valoraciones = pisos
    .map((p) => p.valoracion_score)
    .filter((v) => v !== undefined && v !== null);

  const minValoracion = Math.min(...valoraciones);
  const maxValoracion = Math.max(...valoraciones);
  const handleSugerenciaClick = (piso) => {
    if (window.map) {
      window.map.setView([piso.latitud, piso.longitud], 16);
      setPisoSeleccionado(piso);
    }
  };

  const handleAddToCompare = (piso) => {
    if (!comparePisos.find(p => p.id === piso.id)) {
      setComparePisos([...comparePisos, piso]);
    }
  };

  return (
    <>
      <Navbar onAbrirFormulario={() => setMostrarFormulario(true)} onAbrirComparator={()=> setMostrarComparator(true)} comparateCount={comparePisos.length} />
      <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />
      <button 
        className="list-button" 
        onClick={() => setMostrarListado(!mostrarListado)}
      >
        <FontAwesomeIcon icon={faEye} />
      </button>
      <MapContainer
        center={centro}
        ref={mapRef}
        zoom={14}
        style={{ height: "calc(100vh - 50px)", width: "100vw" }}
      >
        <MapController /> {/* Add this component inside MapContainer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Dibujar polígonos de zonas */}
        {Object.entries(zonas).map(([nombre, coords]) => {
          const isSelected = zonaSeleccionada === nombre;
          return (
            <Polygon
              key={nombre}
              positions={coords}
              pathOptions={{
                color: color_por_zona[nombre],
                fillOpacity: isSelected ? 0.25 : 0.15,
                weight: isSelected ? 2 : 1,
              }}
              eventHandlers={{
                click: () => {
                  const map = mapRef.current;
                  const center = calcularCentroAjustado(coords, map);
                  setZonaSeleccionada(nombre);
                  setCentroZona(center);
                  setPisoSeleccionado(null);
                },
              }}
            />
          );
        })}

        {/* Dibujar pisos */}
        {pisos.map((piso, i) => {
          let color;
          const isSelected = pisoSeleccionado && pisoSeleccionado.id === piso.id;
          const isComparing = comparePisos.some(p => p.id === piso.id);

          if (viewMode === "zona") {
            color = color_por_zona[piso.zona] || "gray";
          } else if (viewMode === "precio") {
            color = getColor(piso.precio, colorScale);
          } else if (viewMode === "valoracion") {
            color = getValoracionColor(
              piso.valoracion_score ?? 0,
              minValoracion,
              maxValoracion
            );
          }

          let markerRef = React.createRef();
          return (
            <>
              <CircleMarker
                key={i}
                center={[piso.latitud, piso.longitud]}
                radius={isComparing && mostrarComparator ? 8 : 5}
                ref={markerRef}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isComparing && mostrarComparator ? 1 : 0.8,
                  weight: isSelected || (isComparing && mostrarComparator) ? 2 : 1,
                }}
                eventHandlers={{
                  click: () => {
                    setPisoSeleccionado(piso);
                    setZonaSeleccionada(null);
                    setCentroZona(null);
                  },
                  mouseover: () => markerRef.current.openPopup(),
                  mouseout: () => markerRef.current.closePopup(),
                }}
              >
                <Popup>
                  <b>{piso.tipo}</b>
                  <br />
                  🏘 Zona: {piso.zona}
                  <br />
                  💰 Precio: {piso.precio.toLocaleString()} €<br />
                  📐 {piso.metros} m²
                  {isComparing && (
                    <>
                      <br />✓ En comparador
                    </>
                  )}
                </Popup>
                {isComparing && mostrarComparator && (
                  <Tooltip permanent direction="top" offset={[0, -10]} className="comparing-tooltip">
                    {comparePisos.findIndex(p => p.id === piso.id) + 1}
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
                    weight: 2.5,
                  }}
                />
              )}
            </>
          );
        })}
        <Legend
          viewMode={viewMode}
          color_por_zona={color_por_zona}
          min={viewMode === "valoracion" ? minValoracion : min}
          max={viewMode === "valoracion" ? maxValoracion : max}
          pisos={pisos}
        />
        <MapClickReset
          zonaSeleccionada={zonaSeleccionada}
          onOutsideClick={() => {
            setZonaSeleccionada(null);
            setCentroZona(null);
            mapRef.current?.setView(centro, 14);
          }}
        />
        {centroZona && <MapCenter center={centroZona} />}
      </MapContainer>
      <ZonaSidebar
        zona={zonaSeleccionada}
        pisos={pisos}
        onClose={() => setZonaSeleccionada(null)}
      />
      <Sidebar
        piso={pisoSeleccionado}
        onClose={() => setPisoSeleccionado(null)}
        onCompare={handleAddToCompare}
      />
      <ComparePanel 
        visible={mostrarComparator}
        onClose={() => setMostrarComparator(false)}
        pisos={comparePisos}
        onRemove={(id) => setComparePisos(comparePisos.filter(p => p.id !== id))}
      />
      <FormularioSidebar
        visible={mostrarFormulario}
        onClose={() => setMostrarFormulario(false)}
      >
      <PisoForm onClose={() => setMostrarFormulario(false)} onSugerenciaClick={handleSugerenciaClick} />
      </FormularioSidebar>
      {mostrarListado && (
        <ListSidebar
          pisos={pisos}
          viewMode={viewMode}
          color_por_zona={color_por_zona}
          min={min}
          max={max}
          onClose={() => setMostrarListado(false)}
          onPisoClick={(piso) => {
            setPisoSeleccionado(piso);
            if (window.map) {
              window.map.setView([piso.latitud, piso.longitud], 16);
            }
          }}
        />
      )}
    </>
  );
}
const calcularCentroAjustado = (coords, map) => {
  const lats = coords.map((c) => c[0]);
  const lons = coords.map((c) => c[1]);
  const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const lon = lons.reduce((a, b) => a + b, 0) / lons.length;

  // Convertimos lat/lon a punto en pantalla
  const centerPoint = map.project([lat, lon]);
  centerPoint.x += 100; // Desplazar hacia la izquierda (en píxeles)

  // Volver a convertir a coordenadas
  const newCenter = map.unproject(centerPoint);
  return [newCenter.lat, newCenter.lng];
};

export default App;
