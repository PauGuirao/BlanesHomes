import React, { useState, Suspense, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import './LandingMap.css';
import mapData from '../../data/mapData.json';
import L from 'leaflet';
import { createPriceScale, createValorScale } from "../../utils/colorUtils";

// Import the existing components
const ZonaPolygons = React.lazy(() => import("../zona/ZonaPolygons"));
const PisoMarkers = React.lazy(() => import("../piso/PisoMarkers"));
import ViewModeSelector from "../ViewModeSelector";

const LandingMap = () => {
  const [selectedZona, setSelectedZona] = useState(null);
  const [pisoSeleccionado, setPisoSeleccionado] = useState(null);
  const { zones } = mapData;
  const [comparePisos, setComparePisos] = useState([]);
  const [similarPisos, setSimilarPisos] = useState([]);
  const [viewMode, setViewMode] = useState("standard");
  
  // Convert property data to match the format expected by PisoMarkers
  const pisos = [
    { 
      id: 1, 
      latitud: 41.6748, 
      longitud: 2.7904, 
      precio: 235000, 
      precio_formatted: '235.000€', 
      tipo: 'Piso', 
      superficie: 85,
      superficie_formatted: '85m²',
      zona: 'Centro'
    },
    { 
      id: 2, 
      latitud: 41.6768, 
      longitud: 2.7934, 
      precio: 189000, 
      precio_formatted: '189.000€', 
      tipo: 'Piso', 
      superficie: 70,
      superficie_formatted: '70m²',
      zona: 'Centro'
    },
    { 
      id: 3, 
      latitud: 41.6728, 
      longitud: 2.7884, 
      precio: 320000, 
      precio_formatted: '320.000€', 
      tipo: 'Casa', 
      superficie: 120,
      superficie_formatted: '120m²',
      zona: 'Residencial'
    },
    { 
      id: 4, 
      latitud: 41.6758, 
      longitud: 2.7954, 
      precio: 275000, 
      precio_formatted: '275.000€', 
      tipo: 'Piso', 
      superficie: 95,
      superficie_formatted: '95m²',
      zona: 'Playa'
    },
    { 
      id: 5, 
      latitud: 41.6738, 
      longitud: 2.7924, 
      precio: 425000, 
      precio_formatted: '425.000€', 
      tipo: 'Casa', 
      superficie: 150,
      superficie_formatted: '150m²',
      zona: 'Residencial'
    }
  ];
  const priceScale = useMemo(() => createPriceScale(pisos.map(p=>p.precio)), [pisos]);
  const valorScale = useMemo(() => createValorScale(pisos.map(p=>p.valoracion_score||0)), [pisos]);

  // Handle marker click
  const handleMarkerClick = (piso) => {
    setPisoSeleccionado(piso);
  };

  return (
    <section className="map-feature">
      <div className="landing-map-container">
        <h2>Análisis geoespacial del mercado</h2>
        <p className="map-description">Visualiza el mercado inmobiliario con mapas interactivos que muestran precios, tendencias y oportunidades por zonas.</p>
        
        <div className="map-showcase">
          
          <div className="map-view">
            <div className="landing-view-mode-selector">
                <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            <MapContainer 
              center={[41.6748, 2.7904]} 
              zoom={14}
              minZoom={13} 
              maxZoom={15}
              scrollWheelZoom={true}
              className="leaflet-container"
              id="property-map"
              preferCanvas={true}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution="&copy; OpenStreetMap contributors"
              />

              <Suspense fallback={null}>
                <ZonaPolygons
                  zonas={zones}
                  selectedZona={selectedZona}
                />
              </Suspense>
              
              <Suspense fallback={null}>
                <PisoMarkers
                  pisos={pisos}
                  comparing={comparePisos}
                  similar={similarPisos}
                  pisoSeleccionado={pisoSeleccionado}
                  onMarkerClick={handleMarkerClick}
                  viewMode={viewMode} // Pass the viewMode to PisoMarkers
                  priceScale={priceScale} 
                  valorScale={valorScale} 
                />
              </Suspense>
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingMap;