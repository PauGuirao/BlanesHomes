import React, { useState } from 'react';
import axios from 'axios';
import './UrlForm.css';

function UrlForm({ onClose, onSugerenciaClick }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const id = url.split('/').filter(Boolean).pop();
      const response = await axios.get(`http://localhost:8000/analisisLink?id=${id}`);
      onSugerenciaClick(response.data);
      onClose();
    } catch (error) {
      setError('Error fetching property data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="url-form">
          <button onClick={onClose} className="close-button">✕</button>

      <h2>Add Property from URL</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste Idealista URL here"
          required
        />
        <button className='submit-button' type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Add Property'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default UrlForm;