import React from "react";
import { Link } from "react-router-dom";
import "./SuccessPage.css";

const SuccessPage = () => {
  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h1 className="success-title">¡Pago completado!</h1>
        <p className="success-message">
          Gracias por suscribirte a HABINIA. Ya puedes usar todas las funcionalidades premium.
        </p>
        <div className="success-actions">
          <Link to="/dashboard" className="primary-button">
            Ir al panel de control
          </Link>
          <Link to="/" className="secondary-button">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
