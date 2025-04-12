import React from "react";
import "./ZonaSidebar.css"; // Import the CSS file for styling

function ZonaSidebar({ zona, pisos, onClose }) {
  if (!zona) return null;

  const pisosZona = pisos.filter((p) => p.zona === zona);
  const precioMedio = Math.round(
    pisosZona.reduce((acc, p) => acc + p.precio, 0) / pisosZona.length
  );
  console.log("Zona seleccionada:", zona);
  return (
    <div className="zona-sidebar">
      <h2>
        📊 <strong>{zona}</strong>
      </h2>

      <p>🏠 Total propiedades: {pisosZona.length}</p>
      <p>💰 Precio medio: {precioMedio.toLocaleString()} €</p>

      <hr />

      <h3>Propiedades:</h3>
      <ul className="zona-sidebar__listado">
        {pisosZona.map((piso, i) => (
          <li key={i} className="zona-sidebar__item">
            💰 {piso.precio.toLocaleString()} €<br />
            📐 {piso.metros} m²
          </li>
        ))}
      </ul>

      <button className="zona-sidebar__close" onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}

export default ZonaSidebar;
