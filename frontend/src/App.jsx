import { useEffect, useState, Suspense, useCallback, useRef, useMemo } from "react";
import React from "react";
import { supabase } from '../src/supabase/supabaseClient';
import LoginForm from './components/login/LoginForm';
// Styles
import "./App.css";

import {
  MapContainer,
  TileLayer,
} from "react-leaflet";

import { zonas, color_por_zona } from "./data/zonas";
import {
  createPriceScale,
  createValorScale,
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
import ActionPanel from "./components/panels/ActionPanel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import UrlForm from "./components/UrlForm";
import VendorView from "./components/views/VendorView";

delete L.Icon.Default.prototype._getIconUrl;
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import MapCenter from "./components/MapCenter";
import MapClickReset from "./components/MapClickReset";

const ZonaPolygons = React.lazy(() => import("./components/zona/ZonaPolygons"));
const PisoMarkers = React.lazy(() => import("./components/piso/PisoMarkers"));

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
    };
    getSession();
  }, []);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); // Clears user session from React state
  };

  useEffect(() => {
    axios.get("http://localhost:8000/pisos").then((res) => {
      setPisos(res.data);
      setFilteredPisos(res.data);
    });
  }, []);

  //-------------- MAP ACTIONS -------------- //
  const mapRef = useRef(null);

  //-------------- ZONA ACTIONS -------------- //
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [centroZona, setCentroZona] = useState(null);

  const handleZoneClick = useCallback((nombre, coords) => {
    // if map isn’t ready yet, bail out
    const map = mapRef.current;
    if (!map) return;

    // compute the adjusted center
    const center = calcularCentroAjustado(coords, map);

    // update React state
    setZonaSeleccionada(nombre);
    setCentroZona(center);
    setPisoSeleccionado(null);
    setActiveSidePanel("zona"); // Show the ZonaSidebar
  }, []);

  //-------------- PISO ACTIONS -------------- //
  const [pisos, setPisos] = useState([]);
  const [filteredPisos, setFilteredPisos] = useState([]);
  const [pisoSeleccionado, setPisoSeleccionado] = useState(null);

  const handleMarkerClick = (p) => {
    setPisoSeleccionado(p);
    setZonaSeleccionada(null);
    setCentroZona(null);
    setActiveSidePanel("piso"); // Show the PisoSidebar
  };

  const handleSugerenciaClick = (piso) => {
    if (mapRef.current) {
      mapRef.current.setView([piso.latitud, piso.longitud], 16);
      setPisoSeleccionado(piso);
    }
  };

  //-------------- VIEW ACTIONS -------------- //
  const [viewMode, setViewMode] = useState("zona");
  useEffect(() => {
    if (viewMode === 'vendedor') {
      // Abrimos el panel de vendor
      setActiveSidePanel('vendor');
      // Opcional: limpiamos selecciones anteriores
      setPisoSeleccionado(null);
      setZonaSeleccionada(null);
      setCentroZona(null);
    } else if (activeSidePanel === 'vendor') {
      // Si cambiamos a otro modo, cerramos el panel de vendor
      setActiveSidePanel(null);
    }
  }, [viewMode]);

  const [comparePisos, setComparePisos] = useState([]);

  //-------------- FORMULARIO ACTIONS -------------- //
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  //-------------- LISTADO ACTIONS -------------- //
  const [mostrarListado, setMostrarListado] = useState(true);

  //-------------- URL FORM ACTIONS -------------- //
  const [mostrarUrlForm, setMostrarUrlForm] = useState(false);

  //-------------- SIDEPANEL ACTIONS -------------- //
  const [activeSidePanel, setActiveSidePanel] = useState(); // Possible values: 'zona', 'piso', 'compare', 'form', 'url', 'list'
  const handleAddToCompare = (piso) => {
    if (!comparePisos.find((p) => p.id === piso.id)) {
      setComparePisos([...comparePisos, piso]);
    }
  };
  //-------------- AGENCY ACTIONS -------------- //
  const [selectedAgency, setSelectedAgency] = useState(null);
  const handleAgencyClick = (agencyName) => {
    setSelectedAgency(prev => (prev === agencyName ? null : agencyName));
  };

  const centro = [41.672, 2.805]; // centro de Blanes
  const precios = pisos.map((p) => p.precio).sort((a, b) => a - b);
  const min = precios[Math.floor(pisos.length * 0.05)]; // 5th percentile
  const max = precios[Math.floor(pisos.length * 0.95)]; // 95th percentile
  const valoraciones = pisos
    .map((p) => p.valoracion_score)
    .filter((v) => v !== undefined && v !== null);

  const minValoracion = Math.min(...valoraciones);
  const maxValoracion = Math.max(...valoraciones);

  const priceScale = useMemo(() => createPriceScale(pisos.map(p=>p.precio)), [pisos]);
  const valorScale = useMemo(() => createValorScale(pisos.map(p=>p.valoracion_score||0)), [pisos]);

  return (
    <>
      {!user ? (<LoginForm onLoginSuccess={setUser} />) : (
        <>
          {/* ----------- NAVBAR ------------- */}
          <Navbar
            onAbrirFormulario={() => {
              setMostrarFormulario(true);
              setMostrarUrlForm(false);
            }}
            onAbrirUrlForm={() => {
              setMostrarUrlForm(true);
              setMostrarFormulario(false);
            }}
            onAbrirComparator={() => {
              setActiveSidePanel("compare");
              setPisoSeleccionado(null);
              setZonaSeleccionada(null);
              setCentroZona(null);
            }}
            onAbrirVendor={() => setActiveSidePanel("vendor")}
            comparateCount={comparePisos.length}
            user={user}
            onLogout={handleLogout}
          />
          {/* ----------- VIEW SELECTOR ------------- */}
          <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />
          <button
            className="list-button"
            onClick={() => setMostrarListado(!mostrarListado)}
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          {/* ---------------- MAPA ------------------ */}
          <MapContainer
            center={centro}
            zoom={14}
            ref={mapRef}
            style={{ height: "calc(100vh - 50px)", width: "100vw" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <Suspense fallback={null}>
              {/* Dibujar polígonos de zonas */}
              <ZonaPolygons
                zonas={zonas}
                selectedZona={zonaSeleccionada}
                onZoneClick={handleZoneClick}
              />
              {/* Dibujar pisos */}
              <PisoMarkers
                pisos={filteredPisos}
                viewMode={viewMode}
                selected={pisoSeleccionado}
                comparing={comparePisos}
                onMarkerClick={handleMarkerClick}
                showCompareTooltips={activeSidePanel === 'compare'}
                priceScale={priceScale}
                valorScale={valorScale}
                selectedAgency={selectedAgency} 
              />
            </Suspense>

            {/* Dibujar la leyenda */}
            <Legend
              viewMode={viewMode}
              color_por_zona={color_por_zona}
              min={viewMode === "valoracion" ? minValoracion : min}
              max={viewMode === "valoracion" ? maxValoracion : max}
              pisos={pisos}
              colorScale={viewMode === "valoracion"? valorScale : priceScale}
            />

            {/* Gestionar el reset del mapa */}
            <MapClickReset
              zonaSeleccionada={zonaSeleccionada}
              onOutsideClick={() => {
                setZonaSeleccionada(null);
                setCentroZona(null);
                mapRef.current?.flyTo(centro, 14);
              }}
            />

            {/* 1) Zona panel: pan to the computed zone center */}
            {activeSidePanel === "zona" && centroZona && (
              <MapCenter center={centroZona} zoom={15} animate={true} />
            )}

            {/* 2) Piso panel: zoom in on the single piso */}
            {activeSidePanel === "piso" && pisoSeleccionado && (
              <MapCenter
                center={[pisoSeleccionado.latitud, pisoSeleccionado.longitud]}
                zoom={15}
                offset={[150, 0]}
                animate={true}
              />
            )}

            {/* 3) Compare panel: fit to all compare‐selected pisos */}
            {activeSidePanel === "compare" && comparePisos.length > 0 && (
              <MapCenter
                bounds={comparePisos.map(p => [p.latitud, p.longitud])}
                padding={[50, 50]}
                animate={true}
              />
            )}
          </MapContainer>

          {/* ----------- SIDEBARS ------------- */}
          <ActionPanel
            visible={!!activeSidePanel}
            onClose={() => {
              // always close the panel
              setActiveSidePanel(null);
              // clear any lingering selection/tooltips
              setPisoSeleccionado(null);
              setZonaSeleccionada(null);
              setCentroZona(null);
            }}
          >
            {activeSidePanel === "zona" && (
              <ZonaSidebar
                zona={zonaSeleccionada}
                pisos={pisos}
              />
            )}
            {activeSidePanel === "piso" && (
              <Sidebar
                piso={pisoSeleccionado}
                onCompare={handleAddToCompare}
              />
            )}
            {activeSidePanel === "compare" && (
              <ComparePanel
                visible={true}
                pisos={comparePisos}
                onRemove={(id) =>
                  setComparePisos(comparePisos.filter((p) => p.id !== id))
                }
              />
            )}
            {activeSidePanel === "vendor" && (
              <VendorView onSelectAgency={handleAgencyClick} />
            )}
          </ActionPanel>
          <FormularioSidebar
            visible={mostrarFormulario || mostrarUrlForm}
            onClose={() => {
              setMostrarFormulario(false);
              setMostrarUrlForm(false);
            }}
          >
            {mostrarFormulario && (
              <PisoForm
                onClose={() => setMostrarFormulario(false)}
                onSugerenciaClick={handleSugerenciaClick}
              />
            )}
            {mostrarUrlForm && (
              <UrlForm
                onClose={() => setMostrarUrlForm(false)}
                onSugerenciaClick={handleSugerenciaClick}
              />
            )}
          </FormularioSidebar>
          {mostrarListado && (
            <ListSidebar
              pisos={pisos}
              filteredPisos={filteredPisos}
              onFilterChange={setFilteredPisos}
              viewMode={viewMode}
              color_por_zona={color_por_zona}
              minPrice={20000}
              maxPrice={5000000}
              onClose={() => setMostrarListado(false)}
              onPisoClick={(piso) => {
                setPisoSeleccionado(piso);
                if (mapRef.current) {
                  mapRef.current.setView([piso.latitud, piso.longitud], 16);
                }
              }}
            />
          )}
        </>
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
