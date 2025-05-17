import React, { useEffect, useState, Suspense, useCallback, useRef, useMemo } from "react";
import { supabase } from '../src/supabase/supabaseClient';
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import './styles/themes.css';

// ----------------------- Styles ---------------------- //
import "./App.css";

// ------------------------ Utils ---------------------- //
import { MapContainer, TileLayer } from "react-leaflet";
import { zonas, color_por_zona } from "./data/zonas";
import { createPriceScale, createValorScale } from "./utils/colorUtils";

// ---------------------- Components ------------------- //
import ActionPanel from "./components/panels/ActionPanel";
import AgencyAnalysis from "./components/agencia/AgencyAnalysis";
import ComparePanel from "./components/compare/ComparePanel";
import Legend from "./components/Legend";
import ListSidebar from "./components/ListSidebar";
import LoginForm from './components/login/LoginForm';
import Register from './components/register/Register'; // Import the Register component
import MapCenter from "./components/MapCenter";
import MapClickReset from "./components/MapClickReset";
import Navbar from "./components/Navbar";
import PisoForm from "./components/buscarpiso/PisoForm";
import Sidebar from "./components/piso/Sidebar";
import UrlForm from "./components/buscarurl/UrlForm";
import VendorView from "./components/views/VendorView";
import ViewModeSelector from "./components/ViewModeSelector";
import ZonaSidebar from "./components/zona/ZonaSideBar";
import ParticularesView from "./components/particular/ParticularesView";
import SuccessPage from "./components/paymentSuccess/SuccessPage";
import LandingPage from "./components/landing/LandingPage";
import ProfilePage from './components/profile/ProfilePage';
import ForgotPassword from './components/login/ForgotPassword';
import ResetPassword from "./components/login/ResetPassword";
import CompletePayment from './components/payment/CompletePayment';
import DashboardNew from "./components/dashboard/new/DashboardNew";
import HeatmapLayer from "./components/piso/HeatmapLayer";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

// -------------------- Lazy-loaded components ---------------- //
const ZonaPolygons = React.lazy(() => import("./components/zona/ZonaPolygons"));
const PisoMarkers = React.lazy(() => import("./components/piso/PisoMarkers"));

// ------------------------ Leaflet icon --------------------- //
delete L.Icon.Default.prototype._getIconUrl;
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function App() {
  const API_URL = import.meta.env.VITE_API_URL;
  // Add a state to track screen size
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Add event listener to track window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  //----------------------------- CITY SELECTION --------------------------- //
  const [selectedCity, setSelectedCity] = useState("blanes");
  const [availableCities, setAvailableCities] = useState([
    { id: "Blanes", name: "Blanes", center: [41.672, 2.805] },
    { id: "Lloret", name: "Lloret de Mar", center: [41.700, 2.847] },
  ]);
  
  const cityCenter = useMemo(() => {
    const city = availableCities.find(c => c.id === selectedCity);
    return city ? city.center : [41.672, 2.805]; // Default to Blanes
  }, [selectedCity, availableCities]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo(cityCenter, 14, {
        duration: 1.5
      });
      
      // Reset selections when changing city
      setPisoSeleccionado(null);
      setZonaSeleccionada(null);
      setCentroZona(null);
      setActiveSidePanel(null);
    }
  }, [selectedCity, cityCenter]);

  //----------------------------- AUTH ACTIONS --------------------------- //
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [profileStatus, setProfileStatus] = useState(null);
  
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log("🔑 Usuario logueado", session);
        await handleSession(session);
      }
    });
  
    // También revisa si ya estaba logueado (ej. recarga)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSession(session);
      } else {
        setLoadingSession(false);
      }
    });
  
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session) => {
    try {
      const response = await axios.get(`${API_URL}/get_profile`, {
        params: { user_id: session.user.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
  
      const profileData = response.data;
      setProfileStatus(profileData.estado);
  
      if (profileData.estado === 'pagado') {
        const res_age = await axios.get(`${API_URL}/get_profile_agency`, {
          params: { user_id: session.user.id },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
  
        const agenciaData = res_age.data;
        setSession({
          token: session.access_token,
          user: session.user,
          agency: agenciaData,
        });
      } else {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      await supabase.auth.signOut();
    } finally {
      setLoadingSession(false);
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); // Clears user session from React state
  };

  //-------------- AGENCY ACTIONS -------------- //
  const [agencyFilter, setAgencyFilter] = useState(null);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const handleAgencyClick = (agencyName) => {
    setSelectedAgency(prev => (prev === agencyName ? null : agencyName));
  };

  //----------------------------- MAP ACTIONS --------------------------- //
  const mapRef = useRef(null);

  //----------------------------- ZONA ACTIONS ------------------------- //
  const [cityZonas,setCityZonas] = useState(null);
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

  const hasFetchedZonas = useRef(false);
  // get the zones from the backend for the selected city
  useEffect(() => {
    const fetchZonas = async () => {
      if (loadingSession || !session || !session.token || hasFetchedZonas.current) return;
      hasFetchedZonas.current = true; // ✅ previene ejecución duplicada

      try {
        const res = await axios.get(`${API_URL}/zonas?ciudad=${selectedCity}`, {
          headers: {
            Authorization: `Bearer ${session.token}`
          }
        });
        setCityZonas(res.data);
      } catch (err) {
        console.error("Error fetching zonas:", err);
        setCityZonas([]);
      }
    }
    fetchZonas();
  } , [selectedCity, session]);

  // --------------------------- PISO ACTIONS -------------------------- //
  const [pisos, setPisos] = useState([]);
  const [filteredPisos, setFilteredPisos] = useState([]);
  const [pisoSeleccionado, setPisoSeleccionado] = useState(null);

  const mapPisos = useMemo(() => {
    if (agencyFilter) {
      return filteredPisos.filter(p => p.anunciante === agencyFilter);
    }
    return filteredPisos;
  }, [filteredPisos, agencyFilter]);

  const hasFetchedPisos = useRef(false);
  useEffect(() => {
    const fetchPisos = async () => {
      if (loadingSession || !session || !session.token || hasFetchedPisos.current) return;
      hasFetchedPisos.current = true;
      try {
        // Add authorization header with Bearer token
        const res = await axios.get(`${API_URL}/pisos?ciudad=${selectedCity}`, {
          headers: {
            Authorization: `Bearer ${session.token}`
          }
        });
        setPisos(res.data);
        setFilteredPisos(res.data);
      } catch (err) {
        console.error("Error fetching pisos:", err);
        setPisos([]);
        setFilteredPisos([]);
      }
    };
  
    fetchPisos();
  }, [selectedCity, session, loadingSession]);

  const handleMarkerClick = (p) => {
    setPisoSeleccionado(p);
    setZonaSeleccionada(null);
    setCentroZona(null);
    setActiveSidePanel("piso"); // Show the PisoSidebar
  };

  const handleSugerenciaClick = (piso) => {
    if (mapRef.current) {
      mapRef.current.flyTo(
        [piso.latitud, piso.longitud], 
        16, 
        {
          duration: 1.5,  // Animation duration in seconds
          easeLinearity: 0.25  // Makes the animation more natural
        }
      );
      setPisoSeleccionado(piso);
    }
  };

  //--------------------------- VIEW ACTIONS ----------------------- //
  const [viewMode, setViewMode] = useState("zona");
  useEffect(() => {
    if (viewMode === 'vendedor') {
      // Opcional: limpiamos selecciones anteriores
      setPisoSeleccionado(null);
      setZonaSeleccionada(null);
      setCentroZona(null);
    }else if (viewMode === 'ocupacion') {
      setPisoSeleccionado(null);
      setZonaSeleccionada(null);
      setCentroZona(null);
    } else if (activeSidePanel === 'vendor') {
      // Si cambiamos a otro modo, cerramos el panel de vendor
      setActiveSidePanel(null);
    }
  }, [viewMode]);

  const [comparePisos, setComparePisos] = useState([]);

  //-------------- LISTADO ACTIONS -------------- //
  const [mostrarListado, setMostrarListado] = useState(true);

  //--------------------------- SEARCH PISO FORM ----------------------- //
  const [similarPisos, setSimilarPisos] = useState([]);

  //-------------- SIDEPANEL ACTIONS -------------- //
  const [activeSidePanel, setActiveSidePanel] = useState(); // Possible values: 'zona', 'piso', 'compare', 'form', 'url', 'list'
  const handleAddToCompare = (piso) => {
    if (!comparePisos.find((p) => p.id === piso.id)) {
      setComparePisos([...comparePisos, piso]);
    }
  };

  //--------------------------- UTILS --------------------------- //
  const [loading, setLoading] = useState(false);
  
  // Update centro to use the selected city's center
  const centro = cityCenter;
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

  const resetAllStates = () => {
    // Check if PisoForm is locked before clearing similarPisos
    const pisoFormState = localStorage.getItem('pisoFormState');
    const shouldPreserveTooltips = pisoFormState !== null;

    // Reset all selection states
    setPisoSeleccionado(null);
    setZonaSeleccionada(null);
    setCentroZona(null);
    setAgencyFilter(null);
    setSelectedAgency(null);
    
    if (!shouldPreserveTooltips) {
      setSimilarPisos([]);
    } else {
      // If form is locked, restore similarPisos from localStorage
      try {
        const parsedState = JSON.parse(pisoFormState);
        if (parsedState.sugerencias && parsedState.sugerencias.length > 0) {
          setSimilarPisos(parsedState.sugerencias);
        }
      } catch (error) {
        console.error("Error parsing saved form state:", error);
      }
    }
    
    // Close any open panels
    setActiveSidePanel(null);
    
    // Reset map view
    if (mapRef.current) {
      mapRef.current.flyTo(centro, 14, {
        duration: 0.4 // Animation duration in seconds
      });
    }
  };
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />}/>
          <Route path="/register" element={<Register />}/>
          <Route path="/dashboard/new" element={<DashboardNew />} />
          <Route path="/forgot-password" element={<ForgotPassword/>} />
          <Route path="/reset-password" element={<ResetPassword/>} />
          <Route path="/complete-payment" element={<CompletePayment />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/login" element={!session ? <LoginForm onLoginSuccess={setSession} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={
            !session ? <Navigate to="/login" /> : (
              <>
                <div>
                {/* ----------- NAVBAR ------------- */}
                  <Navbar
                    onAbrirFormulario={() => {
                      resetAllStates();
                      setActiveSidePanel("pisoform");
                    }}
                    onAbrirUrlForm={() => {
                      resetAllStates();
                      setActiveSidePanel("urlform");
                    }}
                    onAbrirComparator={() => {
                      resetAllStates();
                      setActiveSidePanel("compare");
                    }}
                    onAbrirVendor={() => {
                      resetAllStates();
                      setActiveSidePanel("vendor");
                    }}
                    onAnalizaMiAgencia={() => {
                      resetAllStates();
                      setActiveSidePanel("analisisAgencia");
                    }}
                    onAbrirParticulares={() => {
                      resetAllStates();
                      setActiveSidePanel("particulares");
                    }}
                    comparateCount={comparePisos.length}
                    user={session.user}
                    agencia={session.agency}
                    onLogout={handleLogout}
                    selectedCity={selectedCity}
                    availableCities={availableCities}
                    onCityChange={setSelectedCity}
                    isMobile={isMobile}
                  />
                
                {/* City Selector - Remove this section */}
                
                {/* ----------- VIEW SELECTOR ------------- */}
                <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />
                <button
                  className="list-button"
                  onClick={() => setMostrarListado(!mostrarListado)}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                {/* ---------------- MAPA ------------------ */}
                <div className="map-container">
                  <MapContainer
                    center={centro}
                    zoom={14}
                    ref={mapRef}
                    style={{ height: "calc(100vh - 60px)", width: "100vw" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />

                    <Suspense fallback={null}>
                      {/* Dibujar polígonos de zonas */}
                      <ZonaPolygons
                        zonas={cityZonas}
                        selectedZona={zonaSeleccionada}
                        onZoneClick={handleZoneClick}
                      />
                      {/* Dibujar pisos */}
                      {viewMode === "densidad" ? (
                          <HeatmapLayer 
                          pisos={filteredPisos} 
                          intensity={3}
                          radius={25}
                          blur={15}
                        />
                      ) : (
                        <PisoMarkers
                        pisos={mapPisos}
                        viewMode={viewMode}
                        selected={pisoSeleccionado}
                        comparing={comparePisos}
                        similar={similarPisos} // Pass similarPisos to PisoMarkers
                        onMarkerClick={handleMarkerClick}
                        showCompareTooltips={activeSidePanel === 'compare'}
                        showSimilarTooltips={activeSidePanel === 'pisoform' || localStorage.getItem('pisoFormState') !== null}
                        priceScale={priceScale}
                        valorScale={valorScale}
                        selectedAgency={selectedAgency} 
                      />
                      )}
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
                        zoom={mapRef.current ? mapRef.current.getZoom() : 14}
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
                </div>
                {/* ----------- SIDEBARS ------------- */}
                <div className="panels-container">
                  <ActionPanel visible={!!activeSidePanel} onClose={() => {resetAllStates();}}> 
                    {activeSidePanel === "zona" && (
                      <ZonaSidebar zona={zonaSeleccionada} pisos={pisos} onSugerenciaClick={handleSugerenciaClick} session={session}/>
                    )}
                    {activeSidePanel === "piso" && (
                      <Sidebar piso={pisoSeleccionado} onCompare={handleAddToCompare}/>
                    )}
                    {activeSidePanel === "compare" && (
                      <ComparePanel visible={true} pisos={comparePisos} onRemove={(id) => setComparePisos(comparePisos.filter((p) => p.id !== id))}/>
                    )}
                    {activeSidePanel === "vendor" && (
                      <VendorView onSelectAgency={handleAgencyClick} />
                    )}
                    {activeSidePanel === "pisoform" && (
                      <PisoForm onSugerenciaClick={handleSugerenciaClick} setSimilarPisos={setSimilarPisos} currentAgencyId={session.agency.id} />
                    )}
                    {activeSidePanel === "urlform" && (
                      <UrlForm onSugerenciaClick={handleSugerenciaClick}/>
                    )}
                    {activeSidePanel === "analisisAgencia" && (
                      <AgencyAnalysis userId={session.user.id} setAgencyFilter={setAgencyFilter} />
                    )}
                    {activeSidePanel === "particulares" && (
                      <ParticularesView session={session} pisos={pisos} setAgencyFilter={setAgencyFilter} />
                    )}
                  </ActionPanel>
                </div>
                {/* ----------- LIST SIDEBAR ------------- */}
                <div className="side-container">
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
                        setActiveSidePanel("piso"); // Set the active side panel to "piso"
                        if (mapRef.current) {
                          mapRef.current.setView([piso.latitud, piso.longitud], 16);
                        }
                      }}
                    />
                  )}
                </div>
                </div>
              </>
            )
          } />
        </Routes>
      </Router>
    </ThemeProvider>
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
