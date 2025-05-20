import React from 'react';
import { useQuery } from '@tanstack/react-query';

function ZonaGangas({ zona, onPisoClick }) {
  const API_URL = import.meta.env.VITE_API_URL;

  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['gangas', zona],
    queryFn: () =>
      fetch(`${API_URL}/zona/gangas?id=${encodeURIComponent(zona)}`)
        .then(res => res.json()),
    enabled: !!zona,
    staleTime: 1000 * 60 * 60 * 6, // 6 horas
  });

  if (isLoading) return <p>Cargando oportunidades...</p>;
  if (isError) return <p>❌ Error al cargar las gangas</p>;

  const gangas = data?.gangas || [];

  if (gangas.length === 0) {
    return <p>No hay gangas disponibles en esta zona</p>;
  }

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
