// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './LoginForm.css';

const LoginForm = ({ onLoginSuccess }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get('email');
  
  const [email, setEmail] = useState(emailFromParams || '');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentPending, setPaymentPending] = useState({ isPending: false, userId: null, email: null });
  const [userData, setUserData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    setUserData(null);
    setEmailNotVerified(false);
  
    try {
      //-------- 1. Sign in with email and password --------//
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Check if the error is due to email not being verified
      if (error) { 
        if (error.message.includes('Email not confirmed')) {
          setEmailNotVerified(true);
        } else {
          setErrorMsg(error.message); 
        }
        setLoading(false);
        return;
      }
      
      setUserData(data);
  
      //------- 2. Check if user's profile has the subscription active -------//
      const res_pro = await axios.get(`${API_URL}/get_profile`, {
        params: { user_id: data.user.id },
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      });
      const profileData = res_pro.data;
  
      // If profile is "desactivado", redirect to dashboard/new
      if (profileData.estado === 'desactivado') {
      // Sign out from Supabase first to prevent auto-login to dashboard
      await supabase.auth.signOut();
      
      // Then redirect to dashboard/new with state
      navigate('/dashboard/new', { 
        state: { 
          userId: data.user.id,
          name: data.user.user_metadata?.name || '',
          email: data.user.email
        } 
      });
      return;
      } else if (profileData.estado !== 'pagado') {
        setPaymentPending({ isPending: true, userId: data.user.id, email: email });
        // Sign out the user
        await supabase.auth.signOut();
        return;
      }

      //------- 3. Check if user's has an active agency in its profile -------//
      const res_age = await axios.get(`${API_URL}/get_profile_agency`, {
        params: { user_id: data.user.id },
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      });

      const agenciaData = res_age.data;
      if (!agenciaData || Object.keys(agenciaData).length === 0) {
        setErrorMsg('No tienes una agencia vinculada a tu cuenta.');
        await supabase.auth.signOut();
        return;
      }

      //-------  4.If we reach here, login is successful --------//
      onLoginSuccess({ user: data.user, agency: agenciaData });

    } catch (error) {
      if (error.response?.status === 404) {
        setErrorMsg('No se encontró tu perfil de usuario.');
      } else {
        setErrorMsg('Error al verificar tu perfil.');
      }
      await supabase.auth.signOut();
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayment = () => {
    navigate('/complete-payment', { 
      state: { 
        userId: paymentPending.userId,
        email: paymentPending.email 
      } 
    });
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        setErrorMsg(error.message);
      } else {
        setEmailNotVerified(false);
        setErrorMsg('');
        alert('Se ha enviado un nuevo correo de verificación. Por favor, revisa tu bandeja de entrada.');
      }
    } catch (error) {
      setErrorMsg('Error al reenviar el correo de verificación.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-form-container">
      <div className="login-header">
        <div className="app-logo">
          <Link to="/">
            <img src="/images/logo2.png" alt="HABINIA Logo" className="logo-icon" />
            <h1 className="app-title">
              <span className="logo-main">HABIN</span>
              <span className="logo-gradient">IA</span>
            </h1>
          </Link>
        </div>
        <p className="app-tagline">Análisis inmobiliario inteligente</p>
      </div>
      
      <div className="login-form-title">Iniciar sesión</div>
      
      {emailNotVerified ? (
        <div className="login-form-error verification-error">
          <p>Tu correo electrónico no ha sido verificado. Por favor, verifica tu correo para continuar.</p>
          <button 
            className="resend-verification-button"
            onClick={handleResendVerification}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Reenviar correo de verificación'}
          </button>
        </div>
      ) : paymentPending.isPending ? (
        <div className="login-form-error payment-error">
          <p>Tu cuenta está pendiente de pago. Por favor, completa el proceso de pago para acceder.</p>
          <button 
            className="complete-payment-button"
            onClick={handleCompletePayment}
          >
            Completar pago
          </button>
        </div>
      ) : (
        errorMsg && <div className="login-form-error">{errorMsg}</div>
      )}
      
      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        
        <div className="form-field">
          <label htmlFor="password">Contraseña</label>
          <div className="password-input-container">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="toggle-password-button"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        
        <button className="submitLogin" type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
      
      <div className="login-footer">
        <p>¿No tienes una cuenta? <Link to="/register" className="register-link">Regístrate</Link></p>
        <Link to="/forgot-password" className="forgot-password-link">¿Olvidaste tu contraseña?</Link>
      </div>
      
      <div className="login-features">
        <div className="feature-login">
          <span className="feature-icon">🏠</span>
          <span className="feature-text">Análisis de mercado inmobiliario</span>
        </div>
        <div className="feature-login">
          <span className="feature-icon">📊</span>
          <span className="feature-text">Comparativas de propiedades</span>
        </div>
        <div className="feature-login">
          <span className="feature-icon">🔍</span>
          <span className="feature-text">Búsqueda avanzada</span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
