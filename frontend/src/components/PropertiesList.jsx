import React from 'react';

function PropertiesList({ pisos, onPisoClick }) {
  return (
    <div className="zona-properties">
      <ul className="zona-sidebar__listado">
        {pisos.map((piso) => (
          <div className="zona-piso-item" key={piso.id} onClick={() => onPisoClick(piso)}>
            <div className="piso-info">
              <div className="piso-tipo">{piso.tipo}</div>
              <div className="piso-metros">
                {piso.metros}m² • {piso.habitaciones} hab • {piso.baños} baños
              </div>
              <div className="piso-details">
                <span>Ref: {piso.id}</span>
                <span className="piso-precio">{piso.precio.toLocaleString()} €</span>
              </div>
            </div>
          </div>
        ))}
      </ul>
    </div>
  );
}

export default PropertiesList;