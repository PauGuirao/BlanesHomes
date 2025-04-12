import React from "react";
import "./ViewModeSelector.css";

function ViewModeSelector({ viewMode, setViewMode }) {
  return (
    <div className="viewmode-container">
      <label htmlFor="viewmode">Ver:</label>
      <select
        id="viewmode"
        className="viewmode-select"
        value={viewMode}
        onChange={(e) => setViewMode(e.target.value)}
      >
        <option value="zona">Zona</option>
        <option value="precio">Precio</option>
        <option value="valoracion">Valoración</option>
      </select>
    </div>
  );
}

export default ViewModeSelector;
