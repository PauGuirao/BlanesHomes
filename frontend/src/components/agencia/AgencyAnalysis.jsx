import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AgencyAnalysis.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next'; // Add translation import

const AgencyAnalysis = ({ userId, setAgencyFilter }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useTranslation(); // Add translation hook
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [agencyPisos, setAgencyPisos] = useState([]);
  const [monthlyActiveListings, setMonthlyActiveListings] = useState([]); // State for monthly active listings

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await axios.get(`${API_URL}/analiza_agencia?user_id=${userId}`);
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
        setError(err.response ? err.response.data.detail : t('agencyAnalysis.errorFetchingData', 'Error fetching data'));
      }
    };

    fetchAnalysis();
  }, [userId, setAgencyFilter, t]);

  // Calculate properties above and below predicted price
  const abovePredicted = agencyPisos.filter(piso => piso.precio > piso.precio_estimado).length;
  const belowPredicted = agencyPisos.filter(piso => piso.precio < piso.precio_estimado).length;

  if (error) {
    return <div className="agency-analysis-error">{t('common.error', 'Error')}: {error}</div>;
  }

  if (!analysis) {
    return <div className="agency-analysis-loading">{t('common.loading', 'Loading...')}</div>;
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
          {t('agencyAnalysis.general', 'General')}
        </button>
        <button
          className={`agency-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          {t('agencyAnalysis.properties', 'Properties')}
        </button>
        <button
          className={`agency-tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          {t('agencyAnalysis.monthlyActiveListings', 'Monthly Active Listings')}
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="agency-stats">
          <div className="stat-group">
            <h3>{t('agencyAnalysis.generalMetrics', 'General Metrics')}</h3>
            <div className="stat-item">
              <span>🏠 {t('agencyAnalysis.totalProperties', 'Total Properties')}:</span>
              <span>{analysis.total_propiedades}</span>
            </div>
            <div className="stat-item">
              <span>💰 {t('agencyAnalysis.averagePrice', 'Average Price')}:</span>
              <span>{analysis.precio_medio.toLocaleString()} €</span>
            </div>
            <div className="stat-item">
              <span>📏 {t('agencyAnalysis.averageSize', 'Average Size')}:</span>
              <span>{analysis.metros_medio} m²</span>
            </div>
            <div className="stat-item">
              <span>💶 {t('agencyAnalysis.averagePricePerSqm', 'Average Price/m²')}:</span>
              <span>{analysis.precio_m2_medio.toLocaleString()} €/m²</span>
            </div>
            <div className="stat-item">
              <span>⏳ {t('agencyAnalysis.averageDaysOnMarket', 'Average Days on Market')}:</span>
              <span>{analysis.antiguedad_media_dias} {t('agencyAnalysis.days', 'days')}</span>
            </div>
          </div>
          <div className="stat-group">
            <h3>{t('agencyAnalysis.zoneDistribution', 'Zone Distribution')}</h3>
            {Object.entries(analysis.distribucion_zona).map(([zone, count]) => (
              <div className="stat-item" key={zone}>
                <span>{t(`zones.${zone}`, zone)}:</span>
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
              <h3>{t('agencyAnalysis.priceComparison', 'Price Comparison')}</h3>
              <div className="stat-item">
                <span>{t('agencyAnalysis.abovePredictedPrice', 'Above Predicted Price')}:</span>
                <span>{abovePredicted}</span>
              </div>
              <div className="stat-item">
                <span>{t('agencyAnalysis.belowPredictedPrice', 'Below Predicted Price')}:</span>
                <span>{belowPredicted}</span>
              </div>
            </div>
            {agencyPisos.map((piso) => {
              const priceDifference = ((piso.precio - piso.precio_estimado) / piso.precio_estimado) * 100;
              return (
                <div key={piso.id} className="property-block">
                  <div className="property-details">
                    <span><strong>{t(`propertyTypes.${piso.tipo}`, piso.tipo)}</strong></span>
                    <span>{piso.metros}m² • {piso.habitaciones} {t('pisoForm.roomsShort', 'hab')} • {piso.baños} {t('pisoForm.bathroomsShort', 'baños')}</span>
                    <span>{t('agencyAnalysis.ref', 'Ref')}: {piso.id}</span>
                    <span>{t('agencyAnalysis.realPrice', 'Real Price')}: {piso.precio.toLocaleString()} €</span>
                    <span>{t('agencyAnalysis.estimatedPrice', 'Estimated Price')}: {piso.precio_estimado.toLocaleString()} €</span>
                    <span>{t('agencyAnalysis.priceDifference', 'Price Difference')}: {priceDifference.toFixed(2)}%</span>
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
            <YAxis yAxisId="right" orientation="right" stroke="#ccc" domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1c1c1c', borderRadius: '8px', border: 'none' }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#e74c3c' }}
              formatter={(value, name) => {
                if (name === 'activeListings') {
                  return [value, t('agencyAnalysis.activeListings', 'Active Listings')];
                }
                if (name === 'averagePrice') {
                  return [`${value.toLocaleString()} €`, t('agencyAnalysis.averagePrice', 'Average Price')];
                }
                return [value, name];
              }}
              labelFormatter={(label) => t('agencyAnalysis.month', 'Month') + ': ' + label}
            />
            <Legend
              wrapperStyle={{ color: '#ccc' }}
              iconType="circle"
              formatter={(value) => {
                if (value === 'activeListings') {
                  return t('agencyAnalysis.activeListings', 'Active Listings');
                }
                if (value === 'averagePrice') {
                  return t('agencyAnalysis.averagePrice', 'Average Price');
                }
                return value;
              }}
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