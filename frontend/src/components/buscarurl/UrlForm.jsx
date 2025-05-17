import React, { useState } from 'react';
import axios from 'axios';
import { supabase } from '../../supabase/supabaseClient';
import './UrlForm.css';

function UrlForm({ onClose, onSugerenciaClick }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPropertyDetails(null);
    setSaveStatus(null);
    
    try {
      const id = url.match(/inmueble\/(\d+)/)?.[1];
      if (!id) {
        setError('No se pudo extraer el ID de la URL');
        setLoading(false);
        return;
      }
      const {data: { session }} = await supabase.auth.getSession();
      if (!session) {
        setError('No estás autenticado');
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_URL}/analisisLink`, {
        params: { id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const { price_difference, precio_estimado, piso, valoracion, dias_activo, mejoras } = response.data;

      setPropertyDetails({
        piso,
        precio_estimado,
        price_difference,
        valoracion,
        dias_activo,
        mejoras
      });
      
      // Send the valoracion data to the backend to save
      await saveRatingToBackend(piso.id, valoracion);
      
    } catch (error) {
      console.error(error);
      setError('Error fetching property data');
    } finally {
      setLoading(false);
    }
  };
  
  const saveRatingToBackend = async (pisoId, valoracion) => {
    try {
      const response = await axios.post(`${API_URL}/saveRating`, {
        piso_id: pisoId,
        description_rating: valoracion.descripcion,
        price_rating: valoracion.precio,
        title_rating: valoracion.titulo,
        completeness_rating: valoracion.completitud,
        freshness_rating: valoracion.frescura,
        general_rating: valoracion.overall_score
      });
      
      if (response.data.success) {
        setSaveStatus('Rating saved successfully');
      } else {
        throw new Error(response.data.message || 'Failed to save rating');
      }
    } catch (error) {
      console.error('Error saving rating:', error);
      setSaveStatus('Error saving rating to database');
    }
  };

  return (
    <div className="url-form">
      <h2>Analiza el anuncio</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="input url"
          required
        />
        <button className='submit-button' type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'ANALIZA'}
        </button>
      </form>
      {propertyDetails && (
        <>
          <div className="valoration-section">
            <div className="valoration-container">
              <h3>Nota</h3>
              <div className="valoration-score">
                <span className="score">{propertyDetails.valoracion.overall_score}</span>
                <span className="max-score">/10</span>
              </div>
            </div>
            
            <div className="valoration-breakdown">
              <h3>Desglose de valoración</h3>
              <div className="breakdown-items">
                <div className="breakdown-item">
                  <span className="breakdown-label">Descripción</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${propertyDetails.valoracion.descripcion}%` }}></div>
                  </div>
                  <span className="breakdown-score">{propertyDetails.valoracion.descripcion}/100</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Título</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${propertyDetails.valoracion.titulo}%` }}></div>
                  </div>
                  <span className="breakdown-score">{propertyDetails.valoracion.titulo}/100</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Precio</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${propertyDetails.valoracion.precio}%` }}></div>
                  </div>
                  <span className="breakdown-score">{propertyDetails.valoracion.precio}/100</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Completitud</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${propertyDetails.valoracion.completitud}%` }}></div>
                  </div>
                  <span className="breakdown-score">{propertyDetails.valoracion.completitud}/100</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Frescura</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${propertyDetails.valoracion.frescura}%` }}></div>
                  </div>
                  <span className="breakdown-score">{propertyDetails.valoracion.frescura}/100</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="property-details-container">
            <div className="top-group">
              <div className="property-info-block">
                <h3>Property Information</h3>
                <span><strong>Tipo:</strong> {propertyDetails.piso.tipo}</span>
                <span><strong>Zone:</strong> {propertyDetails.piso.zona}</span>
                <span><strong>Size:</strong> {propertyDetails.piso.metros} m²</span>
                <span><strong>Rooms:</strong> {propertyDetails.piso.habitaciones}</span>
                <span><strong>Bathrooms:</strong> {propertyDetails.piso.baños}</span>
                <span><strong>Category:</strong> {propertyDetails.piso.categoria_valor}</span>
              </div>
              <div className='top-group-right'>           
                {/* Add extras block */}
                <div className="property-extras-block">
                  <h3>Extras</h3>
                  <div className="extras-list">
                    {propertyDetails.piso.garaje === 1 && <span>🚗 Garaje</span>}
                    {propertyDetails.piso.piscina === 1 && <span>🏊 Piscina</span>}
                    {propertyDetails.piso.terraza === 1 && <span>🏞️ Terraza</span>}
                    {propertyDetails.piso.ascensor === 1 && <span>🔼 Ascensor</span>}
                    {propertyDetails.piso.balcon === 1 && <span>🏙️ Balcón</span>}
                    {propertyDetails.piso.aire_acondicionado === 1 && <span>❄️ A/C</span>}
                    {propertyDetails.piso.jardin === 1 && <span>🌳 Jardín</span>}
                    {!propertyDetails.piso.garaje && 
                    !propertyDetails.piso.piscina && 
                    !propertyDetails.piso.terraza && 
                    !propertyDetails.piso.ascensor && 
                    !propertyDetails.piso.balcon && 
                    !propertyDetails.piso.aire_acondicionado && 
                    !propertyDetails.piso.jardin && 
                    <span>No hay extras disponibles</span>}
                  </div>
                </div> 
                {/* Add agency block */}
                <div className="property-agency-block">
                  <h3>Agencia</h3>
                  <span>{propertyDetails.piso.anunciante || "No disponible"}</span>
                </div>
              </div>
            </div>
            <div className="price-comparison">
              <div className=" price-block real-price">
                <h3>Precio real</h3>
                <span>{propertyDetails.piso.precio.toLocaleString()} €</span>
              </div>
              <div className="price-block estimated-price">
                <h3>Nuestra IA predice</h3>
                <div className='predicted-price'>
                  <span className="price">{propertyDetails.precio_estimado.toLocaleString()} €</span>
                  <span className="difference">{propertyDetails.price_difference}%</span>
                </div>
              </div>
            </div>
            
            {/* Replace description block with improvement suggestions */}
            <div className="improvement-suggestions-block">
              <h3>Mejora tu anuncio</h3>
              
              <div className="improvement-section">
                <h4>Título ({propertyDetails.valoracion.titulo}/100)</h4>
                <p className="current-value">Actual: <span>{propertyDetails.piso.titulo || "No disponible"}</span></p>
                {propertyDetails.valoracion.titulo < 80 && (
                  <div className="suggestion">
                    <p className="suggestion-title">Sugerencia:</p>
                    <p className="suggestion-content">
                      {propertyDetails.mejoras.titulo}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="improvement-section">
                <h4>Descripción ({propertyDetails.valoracion.descripcion}/100)</h4>
                <p className="current-value">Longitud actual: <span>{propertyDetails.piso.descripcion ? propertyDetails.piso.descripcion.length : 0} caracteres</span></p>
                {propertyDetails.valoracion.descripcion < 80 && (
                  <div className="suggestion">
                    <p className="suggestion-title">Mejoras:</p>
                    <ul className="suggestion-list">
                      <li>Incluye más detalles sobre la distribución del inmueble</li>
                      <li>Menciona la orientación y luminosidad</li>
                      <li>Describe el entorno y servicios cercanos</li>
                      <li>Destaca características únicas del inmueble</li>
                      <li>Usa párrafos cortos para mejor legibilidad</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="improvement-section">
                <h4>Precio ({propertyDetails.valoracion.precio}/100)</h4>
                <p className="current-value">Actual: <span>{propertyDetails.piso.precio.toLocaleString()} €</span></p>
                {propertyDetails.valoracion.precio < 80 && (
                  <div className="suggestion">
                    <p className="suggestion-title">Sugerencia:</p>
                    <p className="suggestion-content">
                      {propertyDetails.price_difference > 5 
                        ? `Considera ajustar el precio más cerca de ${propertyDetails.precio_estimado.toLocaleString()} € para atraer más interesados.` 
                        : "El precio está bien ajustado al mercado."}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="improvement-section">
                <h4>Completitud ({propertyDetails.valoracion.completitud}/100)</h4>
                {propertyDetails.valoracion.completitud < 80 && (
                  <div className="suggestion">
                    <p className="suggestion-title">Añade más información:</p>
                    <ul className="suggestion-list">
                      {!propertyDetails.piso.garaje && <li>Especifica si incluye garaje</li>}
                      {!propertyDetails.piso.terraza && !propertyDetails.piso.balcon && <li>Menciona si tiene terraza o balcón</li>}
                      {!propertyDetails.piso.aire_acondicionado && <li>Indica si dispone de aire acondicionado</li>}
                      <li>Añade información sobre el estado de conservación</li>
                      <li>Incluye datos sobre la antigüedad del inmueble</li>
                      <li>Especifica gastos de comunidad si los hay</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="improvement-section">
                <h4>Frescura ({propertyDetails.valoracion.frescura}/100)</h4>
                <p className="current-value">Días activo: <span>{propertyDetails.dias_activo}</span></p>
                {propertyDetails.valoracion.frescura < 80 && (
                  <div className="suggestion">
                    <p className="suggestion-title">Recomendación:</p>
                    <p className="suggestion-content">
                      {propertyDetails.dias_activo > 60 
                        ? "Considera renovar el anuncio o ajustar el precio para generar nuevo interés." 
                        : "El anuncio es relativamente reciente."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default UrlForm;
