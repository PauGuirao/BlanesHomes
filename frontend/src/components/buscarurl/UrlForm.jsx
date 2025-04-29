import React, { useState } from 'react';
import axios from 'axios';
import './UrlForm.css';

function UrlForm({ onClose, onSugerenciaClick }) {
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

      const response = await axios.get(`http://localhost:8000/analisisLink?id=${id}`);
      const { price_difference, precio_estimado, piso, valoracion, dias_activo } = response.data;

      setPropertyDetails({
        piso,
        precio_estimado,
        price_difference,
        valoracion,
        dias_activo
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
      const response = await axios.post('http://localhost:8000/saveRating', {
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
      
      {saveStatus && (
        <div className={`save-status ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
          {saveStatus}
        </div>
      )}
      
      {propertyDetails && (
        <>
          <div className="valoration-section">
            <div className="valoration-container">
              <h3>Nota del anuncio</h3>
              <div className="valoration-score">
                <span className="score">{propertyDetails.valoracion.overall_score}</span>
                <span className="max-score">/100</span>
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
            </div>
            <div className="price-comparison">
              <div className=" price-block real-price">
                <h3>Precio real</h3>
                <span>{propertyDetails.piso.precio.toLocaleString()} €</span>
              </div>
              <div className="price-block estimated-price">
                <h3>Precio de la IA y diferencia</h3>
                <span className="price"><strong>Estimated Price:</strong> {propertyDetails.precio_estimado.toLocaleString()} €</span>
                <span className="difference"><strong>Price Difference:</strong> {propertyDetails.price_difference}%</span>
              </div>
            </div>
            <div className="description-block">
              <h3>Descripcion</h3>
              <p>{propertyDetails.piso.descripcion}</p>
            </div>
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default UrlForm;
