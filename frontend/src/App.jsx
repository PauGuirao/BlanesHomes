import React, { useEffect, useState, Suspense, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { zonas, color_por_zona } from "./data/zonas";
import { createPriceScale, createValorScale } from "./utils/colorUtils";

// ---------------------- Components ------------------- //
import ActionPanel from "./components/panels/ActionPanel";
import ListSidebar from "./components/ListSidebar";
import LoginForm from './components/login/LoginForm';
import Register from './components/register/Register'; // Import the Register component
import Navbar from "./components/Navbar";


const PisoForm = React.lazy(() => import("./components/buscarpiso/PisoForm"));
const ZonaSidebar = React.lazy(() => import("./components/zona/ZonaSideBar"));
const Sidebar = React.lazy(() => import("./components/piso/Sidebar"));
const ComparePanel = React.lazy(() => import("./components/compare/ComparePanel"));
const VendorView = React.lazy(() => import("./components/views/VendorView"));
const UrlForm = React.lazy(() => import("./components/buscarurl/UrlForm"));
const AgencyAnalysis = React.lazy(() => import("./components/agencia/AgencyAnalysis"));
const ParticularesView = React.lazy(() => import("./components/particular/ParticularesView"));

import ViewModeSelector from "./components/ViewModeSelector";
import SuccessPage from "./components/paymentSuccess/SuccessPage";
import LandingPage from "./components/landing/LandingPage";
import ProfilePage from './components/profile/ProfilePage';
import ForgotPassword from './components/login/ForgotPassword';
import ResetPassword from "./components/login/ResetPassword";
import CompletePayment from './components/payment/CompletePayment';
import DashboardNew from "./components/dashboard/new/DashboardNew";
import AboutPage from "./components/about/AboutPage";
import MapView from "./components/map/MapView";
import ContactPage from "./components/contact/ContactPage";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";

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

  const centroRef = useRef(cityCenter);
  useEffect(() => {
    centroRef.current = cityCenter;
  }, [cityCenter]);

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
  const hasHandledSession = useRef(false);

  const [profileStatus, setProfileStatus] = useState(null);
  
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleSession(session);
      }
    });
  
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleSession(session);
    });
  
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session) => {
    if (!session || hasHandledSession.current) return; // ❌ Ya fue procesado
    hasHandledSession.current = true; // ✅ Marcar como hecho
    try {
      const response = await axios.get(`${API_URL}/get_organization`, {
        params: { user_id: session.user.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const organizationData = response.data.organization;
      setProfileStatus(organizationData.estado);
      if (organizationData.estado === 'pagado') {
        console.log('PAGO');
        const res_age = await axios.get(`${API_URL}/get_organization_agency`, {
          params: { user_id: session.user.id },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const agenciaData = res_age.data;
        console.log(agenciaData);
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

  //------------------------------------- AGENCY ACTIONS --------------------------------- //
  const [agencyFilter, setAgencyFilter] = useState(null);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const handleAgencyClick = (agencyName) => {
    setSelectedAgency(prev => (prev === agencyName ? null : agencyName));
  };

  //-------------------------------------- ZONA ACTIONS -------------------------------- //
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [centroZona, setCentroZona] = useState(null);

  const {
    data: cityZonas,
    isLoading: loadingZonas,
    error: errorZonas
  } = useQuery({
    queryKey: ['zonas', selectedCity],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/zonas?ciudad=${selectedCity}`, {
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      });
      return res.data;
    },
    enabled: !!session?.token && !!selectedCity
  });

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

  // -------------------------------------- PISO ACTIONS ----------------------------- //
  const {
    data: pisos = [],
    isLoading: loadingPisos,
    error: errorPisos
  } = useQuery({
    queryKey: ['pisos', selectedCity],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/pisos?ciudad=${selectedCity}`, {
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      });
      return res.data;
    },
    enabled: !!session?.token && !loadingSession && !!selectedCity,
    staleTime: 1000 * 60 * 10, // 10 minutos
    cacheTime: 1000 * 60 * 60, // 1 hora
  });

  const [filteredPisos, setFilteredPisos] = useState([]);
  useEffect(() => {
    const areSame = pisos.length === filteredPisos.length &&
                    pisos.every((p, i) => p.id === filteredPisos[i]?.id);
    if (!areSame) {
      setFilteredPisos(pisos);
    }
  }, [pisos]);
  const mapPisos = useMemo(() => {
    if (agencyFilter) {
      return filteredPisos.filter(p => p.anunciante === agencyFilter);
    }
    return filteredPisos;
  }, [filteredPisos, agencyFilter]);

  const [pisoSeleccionado, setPisoSeleccionado] = useState(null);


  const handleMarkerClick = useCallback((p) => {
    setPisoSeleccionado(p);
    setZonaSeleccionada(null);
    setCentroZona(null);
    setActiveSidePanel("piso");
  }, []);

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
  //------------------------------------------------------------------------------------ //

  //--------------------------------------- VIEW ACTIONS ------------------------------- //
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
  const memoSimilarPisos = useMemo(() => similarPisos, [similarPisos]);

  //-------------- SIDEPANEL ACTIONS -------------- //
  const [activeSidePanel, setActiveSidePanel] = useState(); // Possible values: 'zona', 'piso', 'compare', 'form', 'url', 'list'
  const handleAddToCompare = (piso) => {
    if (!comparePisos.find((p) => p.id === piso.id)) {
      setComparePisos([...comparePisos, piso]);
    }
  };

  //--------------------------- UTILS --------------------------- //
  const [loading, setLoading] = useState(false);

  const precios = pisos.map((p) => p.precio).sort((a, b) => a - b);
  const min = precios[Math.floor(pisos.length * 0.05)]; // 5th percentile
  const max = precios[Math.floor(pisos.length * 0.95)]; // 95th percentile
  const valoraciones = pisos
    .map((p) => p.valoracion_score)
    .filter((v) => v !== undefined && v !== null);

  const minValoracion = Math.min(...valoraciones);
  const maxValoracion = Math.max(...valoraciones);

  const preciosArray = useMemo(() => {
    return pisos.map(p => p.precio);
  }, [pisos]);
  
  const valoracionesArray = useMemo(() => {
    return pisos.map(p => p.valoracion_score || 0);
  }, [pisos]);

  const priceScale = useMemo(() => createPriceScale(preciosArray), [preciosArray]);
  const valorScale = useMemo(() => createValorScale(valoracionesArray), [valoracionesArray]);

  //--------------------------------------- MAP ACTIONS ---------------------------------- //
  const mapRef = useRef(null);
  const handleOutsideClick = useCallback(() => {
    setZonaSeleccionada(null);
    setCentroZona(null);
    mapRef.current?.flyTo(centroRef.current, 14);
  }, []);

  const setSimilarPisosIfChanged = useCallback((nuevo) => {
    const iguales = JSON.stringify(nuevo) === JSON.stringify(similarPisos);
    if (!iguales) {
      setSimilarPisos(nuevo);
    }
  }, [similarPisos]);

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
      setSimilarPisosIfChanged([]);
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
    
    if (mapRef.current) {
      mapRef.current.flyTo(centroRef.current, 14, {
        duration: 0.4
      });
    }
  };

  const showZonaCenter = activeSidePanel === "zona" && centroZona;
  const showPisoCenter = activeSidePanel === "piso" && pisoSeleccionado;
  const showCompareCenter = activeSidePanel === "compare" && comparePisos.length > 0;

  const showCompareTooltips = useMemo(
    () => activeSidePanel === "compare",
    [activeSidePanel]
  );
  
  const showSimilarTooltips = useMemo(() => {
    return (
      (activeSidePanel === "pisoform" || localStorage.getItem("pisoFormState") !== null)
      && similarPisos.length > 0
    );
  }, [activeSidePanel, similarPisos]);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />}/>
          <Route path="/about" element={<AboutPage />}/>
          <Route path="/contact" element={<ContactPage />}/>
          <Route path="/privacy" element={<PrivacyPolicy />}/>
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
                {/* ---------------- MAPA ------------------ */}
                <div className="map-container">
                  <MapView
                    mapRef={mapRef}
                    centro={cityCenter}
                    pisos={pisos}
                    mapPisos={mapPisos}
                    filteredPisos={filteredPisos}
                    cityZonas={cityZonas}
                    zonaSeleccionada={zonaSeleccionada}
                    centroZona={centroZona}
                    onZoneClick={handleZoneClick}
                    viewMode={viewMode}
                    pisoSeleccionado={pisoSeleccionado}
                    comparePisos={comparePisos}
                    similarPisos={memoSimilarPisos}
                    priceScale={priceScale}
                    valorScale={valorScale}
                    selectedAgency={selectedAgency}
                    color_por_zona={color_por_zona}
                    min={min}
                    max={max}
                    minValoracion={minValoracion}
                    maxValoracion={maxValoracion}
                    onOutsideClick={handleOutsideClick}
                    onMarkerClick={handleMarkerClick}
                    showZonaCenter={showZonaCenter}
                    showPisoCenter={showPisoCenter}
                    showCompareCenter={showCompareCenter}
                    showCompareTooltips={showCompareTooltips}
                    showSimilarTooltips={showSimilarTooltips}
                    
                  />
                </div>
                {/* ----------- SIDEBARS ------------- */}
                <div className="panels-container">
                  <ActionPanel visible={!!activeSidePanel} onClose={resetAllStates}>
                    <Suspense fallback={<div className="panel-loader">Cargando...</div>}>
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
                    </Suspense>
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
