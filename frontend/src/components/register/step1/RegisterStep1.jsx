import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../supabase/supabaseClient';
import axios from "axios";
import './RegisterStep1.css';

const RegisterStep1 = ({ userData, onNext }) => {
  const [formData, setFormData] = useState({
    name: userData.name || '',
    email: userData.email || '',
    password: userData.password || '',
    confirmPassword: userData.confirmPassword || '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Calculate password strength when password field changes
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };
  
  // Password strength calculation function remains the same
  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const score = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars, isLongEnough]
      .filter(Boolean).length;
    
    if (score <= 2) {
      setPasswordStrength('weak');
    } else if (score <= 3) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Basic validation
    if (!formData.email || !formData.password || !formData.name) {
      setError('Por favor, rellena todos los campos requeridos');
      setLoading(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    
    try {
      //------- 1.Register with Supabase Auth--------//
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          },
          emailRedirectTo: `${window.location.origin}/login?verified=true` 
        }
      });
      
      if (authError) throw authError;
      
      if (authData && authData.user) {
        if (authData.user.identities && authData.user.identities.length > 0) {
          await axios.post("http://localhost:8000/createProfile", {
            id: authData.user.id,
            nombre: formData.name,
            estado: "desactivado",
          });
          
          // Store the registered email and show verification message
          setRegisteredEmail(formData.email);
          setVerificationSent(true);
          
          // We don't call onNext here anymore
        } else {
          setError("El email ya está en uso");
        }
      }
    } catch (error) {
      console.error('Error de registro:', error);
      setError(error.message || 'Ocurrió un error durante el registro');
    } finally {
      setLoading(false);
    }
  };
  
  // If verification email is sent, show verification message
  if (verificationSent) {
    return (
      <div className="verification-container">
        <div className="verification-content">
          <div className="verification-icon">✉️</div>
          <h2 className="verification-title">Verifica tu correo electrónico</h2>
          
          <p className="verification-message">
            Hemos enviado un correo de verificación a <strong>{registeredEmail}</strong>
          </p>
          
          <p className="verification-instructions">
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación 
            para activar tu cuenta y continuar con el proceso de registro.
          </p>
          
          <div className="verification-actions">
            <p className="verification-help">
              ¿No has recibido el correo? Revisa tu carpeta de spam o{' '}
              <Link to="/register" className="resend-link">
                vuelve a intentarlo
              </Link>
            </p>
            
            <Link to="/login" className="verification-login-link">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="register-form-data-container">
      <div className="register-header">
        <h1 className="app-title">BlanesHomes</h1>
        <p className="app-tagline">Tu plataforma inmobiliaria inteligente</p>
      </div>
      
      <div className="register-form-title">Crear una cuenta</div>
      <p className="register-subtitle">Completa tus datos para comenzar</p>
      
      {error && <div className="register-form-error">{error}</div>}
      
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="name">Nombre completo</label>
          <input
            id="name"
            type="text"
            placeholder="Ingresa tu nombre completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>
        
        <div className="form-field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="Crea una contraseña segura"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {passwordStrength && (
            <div className="password-strength-container">
              <div className="password-strength">
                <div className={`password-strength-bar ${passwordStrength}`}></div>
              </div>
              <div className="password-strength-text">
                {passwordStrength === 'weak' && 'Débil'}
                {passwordStrength === 'medium' && 'Media'}
                {passwordStrength === 'strong' && 'Fuerte'}
              </div>
            </div>
          )}
        </div>
        
        <div className="form-field">
          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirma tu contraseña"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="register-button"
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Continuar'}
        </button>
      </form>
      
      <div className="register-footer">
        <p>¿Ya tienes una cuenta? <Link to="/login" className="login-link">Iniciar sesión</Link></p>
      </div>
    </div>
  );
};

export default RegisterStep1;