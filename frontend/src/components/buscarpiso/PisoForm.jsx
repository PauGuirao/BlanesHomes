import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import "./PisoForm.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next'; // Add this import

import ExportModal from "../common/ExportModal";


function PisoForm({ onClose, onSugerenciaClick, setSimilarPisos, currentAgencyId }) {  // Add currentAgencyId prop
  const { t } = useTranslation(); // Add translation hook
  
  // Add state for locking the form
  const [isLocked, setIsLocked] = useState(false);
  
  const [formData, setFormData] = useState({
    metros: "",
    habitaciones: "",
    baños: "",
    zona: "Centre", // Set default value for zona
    tipo: "piso",   // Set default value for tipo
    jardin: false,
    piscina: false,
    balcon: false,
    terraza: false,
    garaje: false,
    ascensor: false,
    aire_acondicionado: false,
    habitable: 1,
  });


  const [precioEstimado, setPrecioEstimado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [showExtras, setShowExtras] = useState(false); // State to toggle extras visibility
  const [searchAttempted, setSearchAttempted] = useState(false); // Track search attempts
  const [selectedPiso, setSelectedPiso] = useState(null); // State to track selected property
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOnlyAgencyProps, setExportOnlyAgencyProps] = useState(false);

  const handlePisoClick = (piso) => {
    if (selectedPiso && selectedPiso === piso) {
      setSelectedPiso(null); // Deselect if the same property is clicked again
    } else {
      setSelectedPiso(piso); // Select the property
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    exportToPDF();
    setShowExportModal(false);
  };

  useEffect(() => {
    if (sugerencias.length > 0) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      setSimilarPisos(sugerencias); // Update similarPisos when suggestions are fetched
    }
  }, [sugerencias, setSimilarPisos]);

  // Add state to track if user's agency properties are found
  const [hasAgencyProperties, setHasAgencyProperties] = useState(true);

  // Add a function to handle the lock/unlock
  const toggleLock = () => {
    setIsLocked(!isLocked);
    // If locking, save the current state to localStorage
    if (!isLocked) {
      localStorage.setItem('pisoFormState', JSON.stringify({
        formData,
        precioEstimado,
        sugerencias,
        searchAttempted
      }));
    } else {
      // If unlocking, remove from localStorage
      localStorage.removeItem('pisoFormState');
    }
  };

  // Load saved state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('pisoFormState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setFormData(parsedState.formData);
      setPrecioEstimado(parsedState.precioEstimado);
      setSugerencias(parsedState.sugerencias);
      setSearchAttempted(parsedState.searchAttempted);
      setSimilarPisos(parsedState.sugerencias);
      setIsLocked(true);
    }
  }, [setSimilarPisos]);

  // Modify handleSubmit to respect the lock
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If the form is locked, show a message and don't proceed
    if (isLocked) {
      alert(t('pisoForm.formLocked', 'El formulario está bloqueado. Desbloquéalo para realizar una nueva búsqueda.'));
      return;
    }
    
    setSearchAttempted(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/estimar_precio",
        formData
      );
      const estimatedPrice = res.data.precio_estimado;
      const lowerBound = Math.round(estimatedPrice * 0.97 / 1000) * 1000; // Round to nearest thousand
      const upperBound = Math.round(estimatedPrice * 1.03 / 1000) * 1000; // Round to nearest thousand
      setPrecioEstimado({ lowerBound, upperBound });

      // Llamar al endpoint de sugerencias
      const sugerenciaRes = await axios.post(
        "http://localhost:8000/sugerencias",
        {
          ...formData,
          precio_estimado: estimatedPrice,
        }
      );
      setSugerencias(sugerenciaRes.data);
      
      // Check if any properties belong to the user's agency
      if (currentAgencyId) {
        const agencyProperties = sugerenciaRes.data.filter(
          property => property.agencia_id === currentAgencyId
        );
        setHasAgencyProperties(agencyProperties.length > 0);
      }
    } catch (error) {
      console.error("Error estimando precio", error);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Filter properties if export only agency properties is selected
    const propertiesToExport = exportOnlyAgencyProps 
      ? sugerencias.filter(p => p.agencia_id === currentAgencyId)
      : sugerencias;
    
    // If exporting only agency properties but none exist
    if (exportOnlyAgencyProps && propertiesToExport.length === 0) {
      alert(t('pisoForm.noAgencyProps', 'No hay propiedades de tu agencia para exportar.'));
      return;
    }

    // Title
    doc.setFontSize(18);
    doc.text(t('pisoForm.reportTitle', 'Real Estate Analysis Report'), 10, 10);

    // Date
    doc.setFontSize(12);
    doc.text(`${t('pisoForm.dateOfAnalysis', 'Date of Analysis')}: ${currentDate}`, 10, 20);

    // Base Property
    doc.setFontSize(14);
    doc.text(t('pisoForm.basePropertySearched', 'Base Property Searched:'), 10, 30);
    doc.setFontSize(12);
    doc.text(
      `${t('pisoForm.type', 'Type')}: ${t(`propertyTypes.${formData.tipo}`, formData.tipo)}, ${t('pisoForm.zone', 'Zone')}: ${formData.zona}, ${t('pisoForm.size', 'Size')}: ${formData.metros} m², ${t('pisoForm.rooms', 'Rooms')}: ${formData.habitaciones}, ${t('pisoForm.bathrooms', 'Bathrooms')}: ${formData.baños}`,
      10,
      40
    );

    // Estimated Price Range
    doc.setFontSize(14);
    doc.text("Estimated Price Range:", 10, 50);
    doc.setFontSize(12);
    doc.text(
      `${precioEstimado.lowerBound.toLocaleString()} € - ${precioEstimado.upperBound.toLocaleString()} €`,
      10,
      60
    );

    // Recommended Properties - Update title based on filter
    doc.setFontSize(14);
    doc.text(exportOnlyAgencyProps ? "Your Agency Properties:" : "Recommended Properties:", 10, 70);
    
    // Starting Y position for the first property
    let yPosition = 80;
    
    // Loop through each property and create a block for it
    propertiesToExport.forEach((property, index) => {
      // Add a new page if there's not enough space
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Property number and title
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Property ${index + 1}: ${property.tipo.charAt(0).toUpperCase() + property.tipo.slice(1)} in ${property.zona}`, 10, yPosition);
      yPosition += 8;
      
      // Property details
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Price: ${property.precio.toLocaleString()} €`, 15, yPosition);
      yPosition += 6;
      doc.text(`Size: ${property.metros} m² | Rooms: ${property.habitaciones} | Bathrooms: ${property.baños}`, 15, yPosition);
      yPosition += 6;
      doc.text(`Similarity: ${property.puntuacion.toFixed(1)}%`, 15, yPosition);
      yPosition += 6;
      doc.text(`Agency: ${property.anunciante || "Private Agency"}`, 15, yPosition);
      yPosition += 6;
      
      // Property URL
      if (property.url) {
        doc.setTextColor(0, 0, 255);
        doc.textWithLink('View Property Online', 15, yPosition, { url: property.url });
        doc.setTextColor(0, 0, 0);
      } else {
        doc.text('URL: Not available', 15, yPosition);
      }
      yPosition += 8;
      
      // Extras section
      doc.setFont(undefined, 'bold');
      doc.text('Extras:', 15, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 6;
      
      // List all extras
      const extras = [];
      if (property.garaje === 1) extras.push('Garage');
      if (property.piscina === 1) extras.push('Pool');
      if (property.terraza === 1) extras.push('Terrace');
      if (property.balcon === 1) extras.push('Balcony');
      if (property.ascensor === 1) extras.push('Elevator');
      if (property.aire_acondicionado === 1) extras.push('Air Conditioning');
      if (property.jardin === 1) extras.push('Garden');
      
      if (extras.length > 0) {
        doc.text(extras.join(', '), 20, yPosition);
      } else {
        doc.text('No extras available', 20, yPosition);
      }
      
      // Add separator line
      yPosition += 10;
      doc.setDrawColor(200, 200, 200);
      doc.line(10, yPosition, 200, yPosition);
      yPosition += 15;
    });

    // Save the PDF
    doc.save(t('pisoForm.reportFilename', 'RealEstateAnalysisReport.pdf'));
  };

  return (
    <div className="piso-form">
      <div className="piso-form-header">
        <h2>{t('pisoForm.searchProperty', 'Busca una vivienda')}</h2>
        <button 
          type="button" 
          className={`lock-button ${isLocked ? 'locked' : 'unlocked'}`}
          onClick={toggleLock}
          title={isLocked ? t('pisoForm.unlockForm', 'Desbloquear formulario') : t('pisoForm.lockForm', 'Bloquear formulario')}
        >
          <FontAwesomeIcon icon={isLocked ? faLock : faLockOpen} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Form fields should be disabled when locked */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="zona">{t('pisoForm.zone', 'Zona')}</label>
            <select
              name="zona"
              value={formData.zona}
              onChange={handleChange}
              required
              disabled={isLocked}
            >
              <option value="Centre">{t('zones.Centre', 'Centre')}</option>
              <option value="La Plantera">{t('zones.LaPlantera', 'La Plantera')}</option>
              <option value="Els Pins">{t('zones.ElsPins', 'Els Pins')}</option>
              <option value="Els Pavos">{t('zones.ElsPavos', 'Els Pavos')}</option>
              <option value="Semicentre">{t('zones.Semicentre', 'Semicentre')}</option>
              <option value="Mont Ferrant - Sant Joan">
                {t('zones.MontFerrantSantJoan', 'Mont Ferrant - Sant Joan')}
              </option>
              <option value="Cala Sant Francesc - Santa Cristina">
                {t('zones.CalaSantFrancescSantaCristina', 'Cala Sant Francesc - Santa Cristina')}
              </option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tipo">{t('pisoForm.type', 'Tipo')}</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              disabled={isLocked}
            >
              <option value="piso">{t('propertyTypes.piso', 'Piso')}</option>
              <option value="casa">{t('propertyTypes.casa', 'Casa')}</option>
              <option value="estudio">{t('propertyTypes.estudio', 'Estudio')}</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="metros">{t('pisoForm.meters', 'Metros')}</label>
            <input
              type="number"
              name="metros"
              placeholder={t('pisoForm.squareMeters', 'Metros cuadrados')}
              value={formData.metros}
              onChange={handleChange}
              min="0"
              onInvalid={(e) => e.target.setCustomValidity(t('pisoForm.invalidValue', 'Por favor, introduce un valor de 0 o superior'))}
              onInput={(e) => e.target.setCustomValidity('')}
              required
              disabled={isLocked}
            />
          </div>
          <div className="form-group">
            <label htmlFor="habitaciones">{t('pisoForm.rooms', 'Habitaciones')}</label>
            <input
              type="number"
              name="habitaciones"
              placeholder={t('pisoForm.numberOfRooms', 'Nº de habitaciones')}
              value={formData.habitaciones}
              onChange={handleChange}
              min="0"
              onInvalid={(e) => e.target.setCustomValidity(t('pisoForm.invalidValue', 'Por favor, introduce un valor de 0 o superior'))}
              onInput={(e) => e.target.setCustomValidity('')}
              required
              disabled={isLocked}
            />
          </div>
          <div className="form-group">
            <label htmlFor="baños">{t('pisoForm.bathrooms', 'Baños')}</label>
            <input
              type="number"
              name="baños"
              placeholder={t('pisoForm.numberOfBathrooms', 'Nº de baños')}
              value={formData.baños}
              onChange={handleChange}
              min="0"
              onInvalid={(e) => e.target.setCustomValidity(t('pisoForm.invalidValue', 'Por favor, introduce un valor de 0 o superior'))}
              onInput={(e) => e.target.setCustomValidity('')}
              required
              disabled={isLocked}
            />
          </div>
        </div>
        <div className="extras-header">
          <label className="section-title">{t('pisoForm.extras', 'Extras')}</label>
          <button type="button" className="toggle-button" onClick={() => setShowExtras(!showExtras)}>
            {showExtras ? "▲" : "▼"}
          </button>
        </div>
        {showExtras && (
          <div className="form-section extras-section">
            <div className="extras-grid">
              {[
                "jardin",
                "piscina",
                "balcon",
                "terraza",
                "garaje",
                "ascensor",
                "aire_acondicionado",
              ].map((name) => (
                <label key={name} className="extra-item">
                  <input
                    type="checkbox"
                    name={name}
                    checked={formData[name]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [name]: e.target.checked,
                      })
                    }
                    disabled={isLocked}
                  />
                  <span className="extra-text">
                    {t(`extras.${name}`, name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "))}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        <button type="submit" className="submit-button" disabled={isLocked}>
          {isLocked ? t('pisoForm.formLocked', 'Formulario bloqueado') : t('pisoForm.search', 'Buscar')}
        </button>
      </form>

      {precioEstimado !== null && (
        <div className="resultado-section">
          <div className="resultado-card">
            <h3>{t('pisoForm.aiEstimatesRange', 'Nuestra IA estima un rango de')}</h3>
            <div className="precio-estimado">
              {precioEstimado.lowerBound.toLocaleString()} € - {precioEstimado.upperBound.toLocaleString()} €
            </div>
          </div>
        </div>
      )}

      {sugerencias.length > 0 ? (
        <div className="sugerencias-section">
          <div className="sugerencias-header">
            <h3>{t('pisoForm.similar', 'Similares')} ({sugerencias.length})</h3>
            <button onClick={handleExportClick} className="export-button">
              {t('pisoForm.exportAnalysis', 'Exportar Analisis')}
            </button>
          </div>
          <ExportModal 
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            onConfirm={handleExportConfirm}
            hasAgencyOption={!!currentAgencyId}
            exportOnlyAgency={exportOnlyAgencyProps}
            setExportOnlyAgency={setExportOnlyAgencyProps}
          />
          {/* Add message when no agency properties are found */}
          {sugerencias.length > 0 && currentAgencyId && !hasAgencyProperties && (
            <div className="agency-notice">
              <div className="agency-notice-content">
                <span className="agency-notice-icon">⚠️</span>
                <p>{t('pisoForm.noAgencyMatch', 'No hay viviendas en tu agencia que coincidan con estos criterios de búsqueda.')}</p>
              </div>
            </div>
          )}
          <div className="sugerencias-grid">
            {sugerencias.map((p, i) => (
              <React.Fragment key={i}>
                <div 
                  className={`sugerencia-card ${p.agencia_id === currentAgencyId ? 'agency-owned' : ''}`}
                  onClick={() => {
                    onSugerenciaClick(p);
                    handlePisoClick(p);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="sugerencia-tipo">
                    {t(`propertyTypes.${p.tipo}`, p.tipo)} {t('pisoForm.in', 'en')} {p.zona}
                    <span className="similarity-score">{p.puntuacion.toFixed(1)}%</span>
                    {p.agencia_id === currentAgencyId && <span className="agency-badge">{t('pisoForm.yourAgency', 'Tu agencia')}</span>}
                  </div>
                  <div className="sugerencia-detalles">
                    <span>{p.metros} m²</span>
                    <span>{p.habitaciones} {t('pisoForm.roomsShort', 'hab')}</span>
                    <span>{p.baños} {t('pisoForm.bathroomsShort', 'baños')}</span>
                  </div>
                  <div className="sugerencia-precio-row">
                    <div className="sugerencia-precio">{p.precio.toLocaleString()} €</div>
                    <div className="sugerencia-agencia">
                      {p.anunciante || t('pisoForm.privateAgency', 'Agencia privada')}
                    </div>
                  </div>
                </div>
                {selectedPiso === p && (
                  <div className="piso-details-panel">
                    <h3>{t('pisoForm.propertyDetails', 'Detalles del Piso')}</h3>
                    <p>{t('pisoForm.price', 'Precio')}: {selectedPiso.precio.toLocaleString()} €</p>
                    <p>{t('pisoForm.estimatedPrice', 'Precio estimado')}: {precioEstimado.lowerBound.toLocaleString()} € - {precioEstimado.upperBound.toLocaleString()} €</p>
                    <p>{t('pisoForm.extras', 'Extras')}:</p>
                    <ul>
                      {Object.keys(formData).filter(key => formData[key] === true).map(extra => (
                        <li key={extra}>{t(`extras.${extra}`, extra.charAt(0).toUpperCase() + extra.slice(1).replace("_", " "))}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : searchAttempted && (
        <div className="no-sugerencias resultado-section">
          <div className="resultado-card">
            <h3>{t('pisoForm.noSimilarProperties', 'No se encontraron viviendas similares.')}</h3>
            <p>{t('pisoForm.adjustCriteria', 'Intenta ajustar tus criterios de búsqueda.')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PisoForm;

