import React, { useState, useEffect } from 'react';

function ZonaGangas({ zona, onPisoClick }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [gangas, setGangas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/zona/gangas?id=${encodeURIComponent(zona)}`)
      .then((res) => res.json())
      .then((data) => {
        setGangas(data.gangas);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading gangas:", error);
        setLoading(false);
      });
  }, [zona]);

  if (loading) return <p>Cargando oportunidades...</p>;
  if (!gangas || gangas.length === 0) return <p>No hay gangas disponibles en esta zona</p>;

  return (
    <div className="zona-gangas">
        {gangas.map((piso) => (
          <div className="ganga-item" key={piso.id} onClick={() => onPisoClick(piso)}>
            <div className="ganga-info">
              <div className="ganga-tipo">{piso.tipo}</div>
              <div className="ganga-details">
                <span>{piso.metros}m² • {piso.habitaciones} hab • {piso.baños} baños</span>
                <span className="ganga-precio">{piso.precio.toLocaleString()}€</span>
              </div>
              <div className="ganga-discount">
                ⭐ {piso.descuento}% por debajo del mercado
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

export default ZonaGangas;