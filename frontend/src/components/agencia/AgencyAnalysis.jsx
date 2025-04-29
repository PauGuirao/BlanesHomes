import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AgencyAnalysis.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AgencyAnalysis = ({ userId, setAgencyFilter }) => {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [agencyPisos, setAgencyPisos] = useState([]);
  const [monthlyActiveListings, setMonthlyActiveListings] = useState([]); // State for monthly active listings

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/analiza_agencia?user_id=${userId}`);
        setAnalysis(response.data);
        setAgencyPisos(response.data.pisos);
        setAgencyFilter(response.data.agencia_nombre);

        // Calculate monthly active listings and average price
        const monthlyData = {};

        response.data.pisos.forEach((piso) => {
          const [year, month] = piso.fecha_publicacion.split('-').map(Number);
          const key = `${year}-${month}`;
          if (!monthlyData[key]) {
            monthlyData[key] = { activeListings: 0, totalPrice: 0, count: 0 };
          }
          monthlyData[key].activeListings += 1;
          monthlyData[key].totalPrice += piso.precio;
          monthlyData[key].count += 1;
        });

        const monthlyActiveListingsArray = Object.entries(monthlyData).map(([key, data]) => ({
          month: key,
          activeListings: data.activeListings,
          averagePrice: data.totalPrice / data.count,
        }));

        setMonthlyActiveListings(monthlyActiveListingsArray);
      } catch (err) {
        setError(err.response ? err.response.data.detail : 'Error fetching data');
      }
    };

    fetchAnalysis();
  }, [userId, setAgencyFilter]);

  // Calculate properties above and below predicted price
  const abovePredicted = agencyPisos.filter(piso => piso.precio > piso.precio_estimado).length;
  const belowPredicted = agencyPisos.filter(piso => piso.precio < piso.precio_estimado).length;

  if (error) {
    return <div className="agency-analysis-error">Error: {error}</div>;
  }

  if (!analysis) {
    return <div className="agency-analysis-loading">Loading...</div>;
  }

  return (
    <div className="agency-analysis-container">
      <h2>
        📊 <strong>{analysis.agencia_nombre}</strong>
      </h2>

      <div className="agency-tabs">
        <button
          className={`agency-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`agency-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Properties
        </button>
        <button
          className={`agency-tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Active Listings
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="agency-stats">
          <div className="stat-group">
            <h3>General Metrics</h3>
            <div className="stat-item">
              <span>🏠 Total Properties:</span>
              <span>{analysis.total_propiedades}</span>
            </div>
            <div className="stat-item">
              <span>💰 Average Price:</span>
              <span>{analysis.precio_medio.toLocaleString()} €</span>
            </div>
            <div className="stat-item">
              <span>📏 Average Size:</span>
              <span>{analysis.metros_medio} m²</span>
            </div>
            <div className="stat-item">
              <span>💶 Average Price/m²:</span>
              <span>{analysis.precio_m2_medio.toLocaleString()} €/m²</span>
            </div>
            <div className="stat-item">
              <span>⏳ Average Days on Market:</span>
              <span>{analysis.antiguedad_media_dias} days</span>
            </div>
          </div>
          <div className="stat-group">
            <h3>Zone Distribution</h3>
            {Object.entries(analysis.distribucion_zona).map(([zone, count]) => (
              <div className="stat-item" key={zone}>
                <span>{zone}:</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="agency-stats">
          <div className="agency-analysis-list">
            <div className="stat-group">
              <h3>Price Comparison</h3>
              <div className="stat-item">
                <span>Above Predicted Price:</span>
                <span>{abovePredicted}</span>
              </div>
              <div className="stat-item">
                <span>Below Predicted Price:</span>
                <span>{belowPredicted}</span>
              </div>
            </div>
            {agencyPisos.map((piso) => {
              const priceDifference = ((piso.precio - piso.precio_estimado) / piso.precio_estimado) * 100;
              return (
                <div key={piso.id} className="property-block">
                  <div className="property-details">
                    <span><strong>{piso.tipo}</strong></span>
                    <span>{piso.metros}m² • {piso.habitaciones} hab • {piso.baños} baños</span>
                    <span>Ref: {piso.id}</span>
                    <span>Real Price: {piso.precio.toLocaleString()} €</span>
                    <span>Estimated Price: {piso.precio_estimado.toLocaleString()} €</span>
                    <span>Price Difference: {priceDifference.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={monthlyActiveListings}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barSize={20}
          >
            <XAxis dataKey="month" stroke="#ccc" />
            <YAxis yAxisId="left" stroke="#ccc" />
            <YAxis yAxisId="right" orientation="right" stroke="#ccc" domain={['auto', 'auto']} />  // Ensure domain is set to 'auto'
            <Tooltip
              contentStyle={{ backgroundColor: '#1c1c1c', borderRadius: '8px', border: 'none' }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#e74c3c' }}
            />
            <Legend
              wrapperStyle={{ color: '#ccc' }}
              iconType="circle"
            />
            <Bar yAxisId="left" dataKey="activeListings" fill="#e74c3c" radius={[10, 10, 0, 0]} />
            <Bar yAxisId="right" dataKey="averagePrice" fill="#8884d8" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AgencyAnalysis;