import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("🔴 Error:", error); 
        setError(error.message);
      } else {
        setMessage("📩 Te hemos enviado un correo para restablecer tu contraseña.");
        setEmail(''); // Clear the email field
      }
    } catch (err) {
      setError("No se pudo enviar el correo. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
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

        <h2 className="forgot-title">Recuperar contraseña</h2>
        <p className="forgot-description">
          Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {error && <div className="forgot-error">{error}</div>}
        {message && <div className="forgot-success">{message}</div>}

        <form onSubmit={handleResetPassword} className="forgot-form">
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

          <button type="submit" disabled={loading || !email}>
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <div className="forgot-footer">
          <Link to="/login" className="back-to-login">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;