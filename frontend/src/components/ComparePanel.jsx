import React from 'react';
import './ComparePanel.css';

function ComparePanel({ pisos, onRemove, onClose, visible }) {
  if (!visible) return null;

  if (!pisos || pisos.length === 0) {
    return (
      <div className="compare-panel">
        <h2>
          Comparador
          <button className="close-button" onClick={onClose}>✕</button>
        </h2>
        <div className="empty-compare">
          <p>No hay pisos para comparar</p>
          <p className="empty-compare-hint">Selecciona pisos en el mapa para añadirlos al comparador</p>
        </div>
      </div>
    );
  }

  // Determine max/min values for highlighting
  const maxMetros = Math.max(...pisos.map(p => p.metros));
  const maxHabitaciones = Math.max(...pisos.map(p => p.habitaciones));
  const maxBaños = Math.max(...pisos.map(p => p.baños));
  const minPrecioM2 = Math.min(...pisos.map(p => Math.round(p.precio / p.metros)));

  return (
    <div className="compare-panel">
      <h2>
        Comparador
        <button className="close-button" onClick={onClose}>✕</button>
      </h2>

      <div className="compare-table">
        <div className="compare-row header">
          <div className="compare-cell">#</div>
          <div className="compare-cell">Tipo</div>
          <div className="compare-cell">Metros</div>
          <div className="compare-cell">Hab</div>
          <div className="compare-cell">Baños</div>
          <div className="compare-cell">Zona</div>
          <div className="compare-cell">Precio</div>
          <div className="compare-cell"></div>
        </div>

        {pisos.map((piso, index) => {
          const precioM2 = Math.round(piso.precio / piso.metros);

          return (
            <div key={piso.id} className="compare-row">
              <div className="compare-cell index">{index + 1}</div>
              <div className="compare-cell">{piso.tipo}</div>
              <div className={`compare-cell ${piso.metros === maxMetros ? 'winner' : ''}`}>
                {piso.metros} m²
              </div>
              <div className={`compare-cell ${piso.habitaciones === maxHabitaciones ? 'winner' : ''}`}>
                {piso.habitaciones}
              </div>
              <div className={`compare-cell ${piso.baños === maxBaños ? 'winner' : ''}`}>
                {piso.baños}
              </div>
              <div className="compare-cell">{piso.zona}</div>
              <div className="compare-cell price">
                <div className="compare-price-main">{piso.precio.toLocaleString()}€</div>
                <div className={`compare-price-m2`}>
                  {precioM2.toLocaleString()}€/m²
                </div>
              </div>
              <div className="compare-cell">
                <button className="remove-compare" onClick={() => onRemove(piso.id)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {pisos.length >= 2 && (
        <a
          href={`/comparar?ids=${pisos.map(p => p.id).join(',')}`}
          className="compare-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Comparar {pisos.length} propiedades
        </a>
      )}
    </div>
  );
}

export default ComparePanel;
