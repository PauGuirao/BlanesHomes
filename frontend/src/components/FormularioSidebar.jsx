import React from "react";
import "./FormularioSidebar.css"; // Estilo aparte para el panel

const FormularioSidebar = ({ visible, onClose, children }) => {
  return (
    <div className={`form-sidebar ${visible ? "open" : ""}`}>{children}</div>
  );
};

export default FormularioSidebar;
