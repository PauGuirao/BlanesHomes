import React from "react";
import "./Navbar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBalanceScale } from '@fortawesome/free-solid-svg-icons';

const Navbar = ({ onAbrirFormulario, onAbrirComparator, comparateCount, onAbrirUrlForm , onAbrirVendor}) => {
  return (
    <nav className="navbar">
      <div className="navbar-title">🏠 Blanes Homes</div>
      <ul className="navbar-links">
        <li><a href="#">Mapa</a></li>
        <li><a href="#">Estadísticas</a></li>
        <li><a href="#">Contacto</a></li>
      </ul>
      <div className="navbar-actions">
        <button className="navbar-button" onClick={onAbrirVendor}>
          <FontAwesomeIcon icon={faBalanceScale} /> Vendores
        </button>
        <button className="navbar-button" onClick={onAbrirUrlForm}>
          Url
        </button>
        <button className="navbar-button" onClick={onAbrirFormulario}>
          <FontAwesomeIcon icon={faSearch} /> Buscar piso
        </button>
        <button className="navbar-button comparate-button" onClick={onAbrirComparator}>
          Comparar
          {comparateCount > 0 && <span className="comparate-badge">{comparateCount}</span>}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
