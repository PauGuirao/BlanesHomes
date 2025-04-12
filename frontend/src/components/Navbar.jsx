// src/components/Navbar.jsx
import React from "react";
import "./Navbar.css"; // We'll style it here

const Navbar = ({ onAbrirFormulario }) => {
  return (
    <nav className="navbar">
      <div className="navbar-title">🏠 Blanes Homes</div>
      <ul className="navbar-links">
        <li>
          <a href="#">Mapa</a>
        </li>
        <li>
          <a href="#">Estadísticas</a>
        </li>
        <li>
          <a href="#">Contacto</a>
        </li>
      </ul>
      <button className="navbar-button" onClick={onAbrirFormulario}>
        Busca un piso
      </button>
    </nav>
  );
};

export default Navbar;
