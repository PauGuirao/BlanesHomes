import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import axios from 'axios';
import './CompletePayment.css';

const CompletePayment = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if we have user data from the location state
    if (location.state?.userId) {
      setUserData({
        id: location.state.userId,
        email: location.state.email
      });
    } else {
      // If no user data in state, check if user is logged in
      const checkUser = async () => {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserData({
            id: data.user.id,
            email: data.user.email
          });
        } else {
          // No user found, redirect to login
          navigate('/login');
        }
      };
      
      checkUser();
    }
  }, [location, navigate]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePayment = async () => {
    if (!userData) {
      setError('No se encontró información del usuario');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call your payment API endpoint
      const response = await axios.post(`${API_URL}/create-checkout-session`, {
        userId: userData.id,
        email: userData.email,
        plan: selectedPlan
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (err) {
      console.error('Payment error:', err);
      setError('Error al procesar el pago. Por favor, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="complete-payment-container">
        <div className="loading-spinner">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="complete-payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h1 className="app-title">BlanesHomes</h1>
          <p className="app-tagline">Tu plataforma inmobiliaria inteligente</p>
        </div>
        
        <h2 className="payment-title">Completa tu suscripción</h2>
        <p className="payment-subtitle">
          Tu cuenta está pendiente de activación. Selecciona un plan para continuar.
        </p>
        
        {error && <div className="payment-error">{error}</div>}
        
        <div className="plans-container">
          <div 
            className={`plan-option ${selectedPlan === 'basic' ? 'selected' : ''}`}
            onClick={() => handlePlanSelect('basic')}
          >
            <div className="plan-header">
              <h3>Plan Básico</h3>
              <div className="plan-price">29€/mes</div>
            </div>
            <ul className="plan-features">
              <li>Acceso a análisis básicos</li>
              <li>Hasta 50 propiedades</li>
              <li>Soporte por email</li>
            </ul>
          </div>
          
          <div 
            className={`plan-option ${selectedPlan === 'premium' ? 'selected' : ''}`}
            onClick={() => handlePlanSelect('premium')}
          >
            <div className="plan-header">
              <h3>Plan Premium</h3>
              <div className="plan-price">49€/mes</div>
              <div className="plan-badge">Recomendado</div>
            </div>
            <ul className="plan-features">
              <li>Análisis avanzados</li>
              <li>Propiedades ilimitadas</li>
              <li>Soporte prioritario</li>
              <li>Herramientas de comparación</li>
            </ul>
          </div>
        </div>
        
        <button 
          className="payment-button"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Continuar al pago'}
        </button>
        
        <div className="payment-footer">
          <p>Al continuar, aceptas nuestros <a href="/terms">Términos y Condiciones</a></p>
        </div>
      </div>
    </div>
  );
};

export default CompletePayment;