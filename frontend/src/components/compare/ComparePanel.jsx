import React from 'react';
import './ComparePanel.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

function ComparePanel({ pisos, onRemove, onClose, visible }) {
  if (!visible) return null;

  if (!pisos || pisos.length === 0) {
    return (
      <div className="compare-panel">
        <h2>
          Comparador
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

  // Prepare data for the price comparison chart
  const chartData = pisos.map((piso, index) => ({
    name: `${index + 1}`,
    precio: piso.precio,
    precioEstimado: piso.precio_estimado || piso.precio * 0.95, // Fallback if no estimate
  }));

  // Prepare data for the radar chart
  const prepareRadarData = () => {
    // Define the attributes to display in the radar chart
    const attributes = [
      { name: 'Metros', key: 'metros', max: Math.max(...pisos.map(p => p.metros)) },
      { name: 'Habitaciones', key: 'habitaciones', max: Math.max(...pisos.map(p => p.habitaciones)) },
      { name: 'Baños', key: 'baños', max: Math.max(...pisos.map(p => p.baños)) },
      { name: 'Precio/m²', key: 'precioM2', max: Math.max(...pisos.map(p => Math.round(p.precio / p.metros))) },
    ];
    
    return attributes.map(attr => {
      const dataPoint = { attribute: attr.name };
      
      pisos.forEach((piso, index) => {
        // For precio/m2, calculate it; for others, use the property value
        const value = attr.key === 'precioM2' 
          ? Math.round(piso.precio / piso.metros) 
          : piso[attr.key];
          
        // Normalize the value (0-100 scale) for better radar visualization
        const normalizedValue = (value / attr.max) * 100;
        dataPoint[`${index + 1}`] = normalizedValue;
      });
      
      return dataPoint;
    });
  };
  
  // Calculate winners for each attribute
  const calculateWinners = () => {
    const winners = [];
    
    // Define the attributes to compare
    const attributes = [
      { name: 'Metros', key: 'metros', higher: true },
      { name: 'Habitaciones', key: 'habitaciones', higher: true },
      { name: 'Baños', key: 'baños', higher: true },
      { name: 'Precio/m²', key: 'precioM2', higher: false }, // Lower is better for price
    ];
    
    attributes.forEach(attr => {
      let winnerIndex = 0;
      let bestValue = attr.key === 'precioM2' 
        ? Math.round(pisos[0].precio / pisos[0].metros)
        : pisos[0][attr.key];
      
      pisos.forEach((piso, index) => {
        const value = attr.key === 'precioM2'
          ? Math.round(piso.precio / piso.metros)
          : piso[attr.key];
          
        if ((attr.higher && value > bestValue) || (!attr.higher && value < bestValue)) {
          bestValue = value;
          winnerIndex = index;
        }
      });
      
      winners.push({
        attribute: attr.name,
        winnerIndex,
        value: bestValue,
        key: attr.key
      });
    });
    
    return winners;
  };
  
  const radarData = prepareRadarData();
  const winners = calculateWinners();

  // Custom tooltip formatter for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Propiedad ${label}`}</p>
          <p className="tooltip-precio">
            <span className="tooltip-dot" style={{ backgroundColor: '#e74c3c' }}></span>
            {`Precio: ${payload[0].value.toLocaleString()}€`}
          </p>
          <p className="tooltip-estimado">
            <span className="tooltip-dot" style={{ backgroundColor: '#3498db' }}></span>
            {`Estimado: ${payload[1].value.toLocaleString()}€`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for radar chart
  const RadarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const attribute = payload[0].payload.attribute;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{attribute}</p>
          {payload.map((entry, index) => {
            // Get the actual value before normalization
            const piso = pisos[parseInt(entry.name.split(' ')[1]) - 1];
            let actualValue;
            
            if (attribute === 'Precio/m²') {
              actualValue = Math.round(piso.precio / piso.metros).toLocaleString() + '€/m²';
            } else if (attribute === 'Metros') {
              actualValue = piso.metros + ' m²';
            } else {
              actualValue = piso[attribute.toLowerCase()];
            }
            
            return (
              <p key={index} className="tooltip-item">
                <span className="tooltip-dot" style={{ backgroundColor: entry.color }}></span>
                {`${entry.name}: ${actualValue}`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Generate colors for radar chart
  const radarColors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#34495e'
  ];

  return (
    <div className="compare-panel">
      <h2>
        Comparador
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
        <>
          <div className="charts-container">
            <div className="price-chart-container">
              <h3>Comparación de Precios</h3>
              <div className="price-chart">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#ccc" />
                    <YAxis 
                      stroke="#ccc" 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#ccc' }} />
                    <Bar dataKey="precio" name="Precio Actual" fill="#e74c3c" />
                    <Bar dataKey="precioEstimado" name="Precio Estimado" fill="#3498db" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="radar-chart-container">
              <h3>Comparación de Características</h3>
              <div className="radar-chart-with-leaderboard">
                <div className="radar-chart">
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis dataKey="attribute" tick={{ fill: '#ccc', fontSize: 12 }} />

                      {pisos.map((piso, index) => (
                        <Radar
                          key={piso.id}
                          name={`${index + 1}`}
                          dataKey={`${index + 1}`}
                          stroke={radarColors[index % radarColors.length]}
                          fill={radarColors[index % radarColors.length]}
                          fillOpacity={0.2}
                        />
                      ))}
                      
                      <Legend wrapperStyle={{ color: '#ccc' }} />
                      <Tooltip content={<RadarTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="radar-leaderboard">
                  <h4>Mejores Características</h4>
                  <ul className="leaderboard-list">
                    {winners.map((winner, index) => {
                      let displayValue;
                      if (winner.key === 'precioM2') {
                        displayValue = Math.round(pisos[winner.winnerIndex].precio / pisos[winner.winnerIndex].metros).toLocaleString() + '€/m²';
                      } else if (winner.key === 'metros') {
                        displayValue = winner.value + ' m²';
                      } else {
                        displayValue = winner.value;
                      }
                      
                      return (
                        <li key={index} className="leaderboard-item">
                          <div className="leaderboard-attribute">{winner.attribute}</div>
                          <div className="leaderboard-winner">
                            <span 
                              className="leaderboard-color" 
                              style={{ backgroundColor: radarColors[winner.winnerIndex % radarColors.length] }}
                            ></span>
                            <span className="leaderboard-prop">{winner.winnerIndex + 1}</span>
                            <span className="leaderboard-value">{displayValue}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <a
            href={`/comparar?ids=${pisos.map(p => p.id).join(',')}`}
            className="compare-button"
            target="_blank"
            rel="noopener noreferrer"
          >
            Comparar {pisos.length} propiedades
          </a>
        </>
      )}
    </div>
  );
}

export default ComparePanel;
