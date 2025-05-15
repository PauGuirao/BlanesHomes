import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase/supabaseClient';
import axios from "axios";
import './RegisterStep2.css';

const RegisterStep2 = ({ userData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    agencyId: userData.agencyId || '',
  });
  
  const [agencies, setAgencies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Fetch agencies when component mounts
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const { data, error } = await supabase
          .from('agencias')
          .select('id, nombre')
          .order('nombre');
          
        if (error) throw error;
        setAgencies(data || []);
      } catch (error) {
        console.error('Error fetching agencies:', error);
        setError('Error al cargar las agencias');
      }
    };
    
    fetchAgencies();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validation
    if (!formData.agencyId) {
      setError('Por favor, selecciona una agencia');
      setLoading(false);
      return;
    }
    
    try {
      // Move to the next step with the agency ID
      onNext({ agencyId: formData.agencyId });
    } catch (error) {
      console.error('Error selecting agency:', error);
      setError(error.message || 'Ocurrió un error al seleccionar la agencia');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-step2-container">
      <div className="user-email-block">
        <div className="email-icon">✉️</div>
        <div className="email-info">
          <div className="email-label">Estás registrado con el correo:</div>
          <div className="email-value">{userData.email}</div>
        </div>
      </div>
      
      <div className="register-form-wrapper">
        <h2 className="form-title">Selecciona tu agencia</h2>
        
        {error && <div className="register-error">{error}</div>}
        
        <form className="" onSubmit={handleSubmit}>
          <p className="agency-instruction">
            Selecciona la agencia inmobiliaria a la que perteneces:
          </p>
          
          <select
            name="agencyId"
            value={formData.agencyId}
            onChange={handleChange}
            required
            className="agency-select"
          >
            <option value="">Selecciona una agencia</option>
            {agencies.map(agency => (
              <option key={agency.id} value={agency.id}>
                {agency.nombre}
              </option>
            ))}
          </select>
          
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Continuar al pago'}
          </button>
          
          <button 
            type="button" 
            className="back-button"
            onClick={onBack}
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterStep2;