import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import './RegisterStep3.css';

const RegisterStep3 = ({ userData, onBack }) => {
  const [formData, setFormData] = useState({
    agencyId: userData.agencyId || '',
    plan: userData.plan || '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handlePlanSelect = (plan) => {
    setFormData({
      ...formData,
      plan: plan
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validation
    if (!formData.plan) {
      setError('Por favor, selecciona un plan');
      setLoading(false);
      return;
    }
    
    try {
      // Create a Stripe checkout session
      // Update profile with agency ID and set status to pendiente_pago
      console.log(formData.agencyId)
      await axios.post("http://localhost:8000/updateProfile", {
        id: userData.id,
        agencia_id: formData.agencyId,
        estado: "pendiente_pago"
      });

      const response = await axios.post("http://localhost:8000/create-checkout-session", {
        userId: userData.id,
        plan: formData.plan,
        userEmail: userData.email,
        userName: userData.name
      });
      
      // Redirect to Stripe Checkout
      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No se pudo crear la sesión de pago');
      }
    } catch (error) {
      console.error('Error completing registration:', error);
      setError(error.message || 'Ocurrió un error durante el registro');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
    <div className="register-form-payment-container">  
      <h2 className="register-title">Selecciona tu plan</h2>
      
      {error && <div className="register-error">{error}</div>}
      
      <div className="pricing-container">
        <div className="pricing-cards">
          {/* Plan Básico */}
          <div className={`pricing-card ${formData.plan === 'basic' ? 'selected' : ''}`}>
            <div className="pricing-header">
              <h3>Básico</h3>
              <div className="pricing-price">
                <span className="price">€19</span>
                <span className="period">por mes</span>
              </div>
              <div className="pricing-billing">
                Facturado anualmente €228
                <br />6+ meses gratis
              </div>
              <button 
                type="button" 
                className="subscribe-button"
                onClick={() => handlePlanSelect('basic')}
              >
                {formData.plan === 'basic' ? 'Seleccionado ✓' : 'Seleccionar →'}
              </button>
            </div>
            
            <div className="pricing-features">
              <div className="feature">
                <span className="check">✓</span> Hasta 10 propiedades
              </div>
              <div className="feature">
                <span className="check">✓</span> 1 usuario
              </div>
              <div className="feature highlight">
                <span className="check">✓</span> Calidad estándar
              </div>
              <div className="feature">
                <span className="check">✓</span> Análisis básico
              </div>
              <div className="feature">
                <span className="check">✓</span> Soporte por email
              </div>
              <div className="feature">
                <span className="check">✓</span> Para uso personal
              </div>
            </div>
          </div>
          
          {/* Plan Pro */}
          <div className={`pricing-card ${formData.plan === 'pro' ? 'selected' : ''}`}>
            <div className="pricing-header">
              <h3>Pro</h3>
              <div className="pricing-price">
                <span className="price">€39</span>
                <span className="period">por mes</span>
              </div>
              <div className="pricing-billing">
                Facturado anualmente €468
                <br />6+ meses gratis
              </div>
              <button 
                type="button" 
                className="subscribe-button"
                onClick={() => handlePlanSelect('pro')}
              >
                {formData.plan === 'pro' ? 'Seleccionado ✓' : 'Seleccionar →'}
              </button>
            </div>
            
            <div className="pricing-features">
              <div className="feature">
                <span className="check">✓</span> Propiedades ilimitadas
              </div>
              <div className="feature">
                <span className="check">✓</span> 3 usuarios
              </div>
              <div className="feature highlight">
                <span className="check">✓</span> Alta calidad
              </div>
              <div className="feature">
                <span className="check">✓</span> Análisis avanzado
              </div>
              <div className="feature">
                <span className="check">✓</span> Soporte prioritario
              </div>
              <div className="feature">
                <span className="check">✓</span> Uso comercial
              </div>
            </div>
          </div>
          
          {/* Plan Premium */}
          <div className={`pricing-card premium ${formData.plan === 'premium' ? 'selected' : ''}`}>
            <div className="most-popular">Más popular</div>
            <div className="pricing-header">
              <h3>Premium</h3>
              <div className="pricing-price">
                <span className="price">€59</span>
                <span className="period">por mes</span>
              </div>
              <div className="pricing-billing">
                Facturado anualmente €708
                <br />6+ meses gratis
              </div>
              <button 
                type="button" 
                className="subscribe-button"
                onClick={() => handlePlanSelect('premium')}
              >
                {formData.plan === 'premium' ? 'Seleccionado ✓' : 'Seleccionar →'}
              </button>
            </div>
            
            <div className="pricing-features">
              <div className="feature">
                <span className="check">✓</span> Propiedades ilimitadas
              </div>
              <div className="feature">
                <span className="check">✓</span> 10 usuarios
              </div>
              <div className="feature highlight">
                <span className="check">✓</span> Calidad premium
              </div>
              <div className="feature">
                <span className="check">✓</span> Análisis completo
              </div>
              <div className="feature highlight">
                <span className="check">✓</span> Exportar informes
              </div>
              <div className="feature highlight">
                <span className="check">✓</span> Herramientas avanzadas
              </div>
            </div>
          </div>
        </div>
        
        <div className="pricing-actions">
          <button 
            type="button" 
            className="back-button"
            onClick={onBack}
          >
            Volver
          </button>
          
          <button 
            type="submit" 
            className="register-button"
            disabled={loading || !formData.plan}
            onClick={handleSubmit}
          >
            {loading ? 'Completando registro...' : 'Completar registro'}
          </button>
        </div>
      </div>
      </div>  
    </>
  );
};

export default RegisterStep3;