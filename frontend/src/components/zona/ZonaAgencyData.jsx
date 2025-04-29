import React from "react";
import "./ZonaAgencyData.css";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function ZonaAgencyData({ zona, pisos, session, zonaStats, onPisoClick }) {
  // Calculate agency stats for this zone
  const agency = session?.agency;
  // Filter pisos to only include those from the current agency
  const agencyPisos = agency ? pisos.filter(p => p.anunciante === agency.nombre) : [];
  
  const totalAgencyPisos = agencyPisos.length;
  const marketShare = totalAgencyPisos > 0 
    ? ((totalAgencyPisos / zonaStats.total_propiedades) * 100).toFixed(1) 
    : 0;
  
  // Calculate average price of agency properties in this zone
  const avgAgencyPrice = totalAgencyPisos > 0 
    ? agencyPisos.reduce((sum, piso) => sum + piso.precio, 0) / totalAgencyPisos 
    : 0;
  
  // Calculate price difference compared to zone average
  const priceDiff = avgAgencyPrice > 0 
    ? ((avgAgencyPrice - zonaStats.precio_medio) / zonaStats.precio_medio * 100).toFixed(1)
    : 0;
  
  // Prepare data for pie chart (market share)
  const marketShareData = [
    { name: 'Mi Agencia', value: parseFloat(marketShare) },
    { name: 'Otras Agencias', value: 100 - parseFloat(marketShare) }
  ];
  
  // Prepare data for property types comparison
  const prepareTypeComparisonData = () => {
    // Count property types for agency
    const agencyTypes = {};
    agencyPisos.forEach(piso => {
      agencyTypes[piso.tipo] = (agencyTypes[piso.tipo] || 0) + 1;
    });
    
    // Convert to percentages
    const agencyTypePercentages = {};
    Object.keys(agencyTypes).forEach(tipo => {
      agencyTypePercentages[tipo] = (agencyTypes[tipo] / totalAgencyPisos * 100).toFixed(1);
    });
    
    // Prepare comparison data
    return Object.keys(zonaStats.tipos).map(tipo => ({
      name: tipo,
      'Zona': parseFloat(zonaStats.tipos[tipo]),
      'Mi Agencia': parseFloat(agencyTypePercentages[tipo] || 0)
    }));
  };
  
  const typeComparisonData = prepareTypeComparisonData();
  
  // Colors for charts
  const COLORS = ['#0088FE', '#AAAAAA'];
  
  return (
    <div className="zona-agency-data">
      <div className="agency-header">
        <h3>{agency.nombre} en {zona}</h3>
      </div>
      
      <div className="agency-stats">
        <div className="agency-stat-item">
          <div className="stat-value">{totalAgencyPisos}</div>
          <div className="stat-label">Propiedades</div>
        </div>
        <div className="agency-stat-item">
          <div className="stat-value">{marketShare}%</div>
          <div className="stat-label">Cuota de mercado</div>
        </div>
        <div className="agency-stat-item">
          <div className={`stat-value ${priceDiff > 0 ? 'higher' : priceDiff < 0 ? 'lower' : ''}`}>
            {avgAgencyPrice.toLocaleString()}€
            {priceDiff !== 0 && (
              <span className="price-diff">
                {priceDiff > 0 ? '+' : ''}{priceDiff}%
              </span>
            )}
          </div>
          <div className="stat-label">Precio medio</div>
        </div>
      </div>
      
      {totalAgencyPisos > 0 ? (
        <>
          <div className="agency-charts">
            <div className="market-share-chart">
              <h4>Cuota de Mercado</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={marketShareData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {marketShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="type-comparison-chart">
              <h4>Tipos de Propiedades</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={typeComparisonData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="Zona" fill="#8884d8" />
                  <Bar dataKey="Mi Agencia" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="agency-properties">
            <h4>Mis Propiedades en {zona}</h4>
            <div className="agency-properties-list">
              {agencyPisos.map(piso => (
                <div 
                  key={piso.id} 
                  className="agency-property-item"
                  onClick={() => onPisoClick(piso)}
                >
                  <div className="property-info">
                    <div className="property-type">{piso.tipo}</div>
                    <div className="property-details">
                      <span>{piso.metros} m²</span>
                      <span>{piso.habitaciones} hab</span>
                      <span>{piso.baños} baños</span>
                    </div>
                  </div>
                  <div className="property-price">
                    {piso.precio.toLocaleString()} €
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="no-properties">
          <p>No tienes propiedades en esta zona.</p>
          <p>Añade propiedades para ver estadísticas específicas de tu agencia.</p>
        </div>
      )}
    </div>
  );
}

export default ZonaAgencyData;