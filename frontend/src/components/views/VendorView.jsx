import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // Add translation import
import './VendorView.css';
import {
  BarChart,  // Change this import
  Bar,       // Add this import
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const VendorView = ({ onClose, onPisoClick, onSelectAgency }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useTranslation(); // Add translation hook
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generalStats, setGeneralStats] = useState({});

  useEffect(() => {
    axios.get(`${API_URL}/vendedores`)
      .then(response => {
        setVendors(response.data.vendedores);
        setGeneralStats(response.data.stats);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching vendors:', error);
        setLoading(false);
      });
  }, []);

  const loadVendorDetails = (nombre) => {
    setLoading(true);
    axios.get(`${API_URL}/vendedor/${encodeURIComponent(nombre)}`)
      .then(response => {
        setSelectedVendor(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching vendor details:', error);
        setLoading(false);
      });
  };

  return (
    <div className="vendor-view">
      <h2>{t('vendorView.agencies', 'Agencias')}</h2>
      
      <div className="zona-stats">
        <div className="stat-group">
          <h3>{t('vendorView.generalStatistics', 'General Statistics')}</h3>
          <div className="stat-item">
            <span className="stat-label">{t('vendorView.totalAgencies', 'Total Agencies')}</span>
            <span className="stat-value">{generalStats.total_agencias}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('vendorView.privateSellers', 'Private Sellers')}</span>
            <span className="stat-value">{generalStats.particulares}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('vendorView.totalProperties', 'Total Properties')}</span>
            <span className="stat-value">{generalStats.total_propiedades}</span>
          </div>
        </div>

        <div className="stat-group">
          <h3>{t('vendorView.marketLeader', 'Market Leader')}</h3>
          <div className="stat-item">
            <span className="stat-label">{t('vendorView.agency', 'Agency')}</span>
            <span className="stat-value">{generalStats.agencia_dominante?.nombre}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('vendorView.properties', 'Properties')}</span>
            <span className="stat-value">{generalStats.agencia_dominante?.propiedades}</span>
          </div>
        </div>
      </div>

      <h3>{t('vendorView.realEstateAgencies', 'Real Estate Agencies')}</h3>
      <div className="vendor-list">
        {vendors
          .sort((a, b) => b.total_propiedades - a.total_propiedades)
          .map(vendor => (
            <div key={vendor.nombre}>
              <div 
                className="vendor-card"
                onClick={() => {
                  if (selectedVendor && selectedVendor.nombre === vendor.nombre) {
                    setSelectedVendor(null);
                    onSelectAgency(null);
                  } else {
                    loadVendorDetails(vendor.nombre);
                    onSelectAgency(vendor.nombre);
                  }
                }}
                style={{ marginBottom: selectedVendor?.nombre === vendor.nombre ? 0 : undefined }}
              >
                <div className="vendor-card-header">
                  <h3>{vendor.nombre}</h3>
                  <div className="vendor-properties">
                    {vendor.total_propiedades} {t('vendorView.properties', 'properties')}
                  </div>
                </div>
                <div className="vendor-stats">
                  <div className="stat-row">
                    <span>{t('vendorView.avgPrice', 'Avg. Price')}:</span>
                    <span>{vendor.precio_medio.toLocaleString()}€</span>
                  </div>
                  <div className="stat-row">
                    <span>{t('vendorView.avgSize', 'Avg. Size')}:</span>
                    <span>{vendor.metros_medio}m²</span>
                  </div>
                </div>
              </div>
              {selectedVendor && selectedVendor.nombre === vendor.nombre && (
                <>
                  <div className="vendor-detail-expanded">
                    <div className="vendor-detail-header">
                      <div className="vendor-detail-title">
                        {selectedVendor.nombre}
                      </div>
                      <div className="vendor-detail-subtitle">
                        {selectedVendor.total_propiedades} {t('vendorView.propertiesInPortfolio', 'properties in portfolio')}
                      </div>
                    </div>
                    
                    <div className="vendor-detail-content">
                      <div className="vendor-detail-section">
                        <div className="section-label">{t('vendorView.priceStatistics', 'Price Statistics')}</div>
                        <div className="stats-grid-container">
                          <div className="stat-box">
                            <div className="stat-box-label">{t('vendorView.range', 'Range')}</div>
                            <div className="stat-box-value">{selectedVendor.precio_min.toLocaleString()}€ - {selectedVendor.precio_max.toLocaleString()}€</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-box-label">{t('vendorView.average', 'Average')}</div>
                            <div className="stat-box-value">{selectedVendor.precio_medio.toLocaleString()}€</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-box-label">{t('vendorView.pricePerSqm', 'Price/m²')}</div>
                            <div className="stat-box-value">{Math.round(selectedVendor.precio_medio / selectedVendor.metros_medio).toLocaleString()}€/m²</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="vendor-detail-section">
                        <div className="section-label">{t('vendorView.marketActivity', 'Market Activity')}</div>
                        <div className="activity-status-container">
                          <div className={`activity-status ${selectedVendor.nuevos_al_mes > 5 ? 'active' : 'inactive'}`}>
                            {selectedVendor.nuevos_al_mes > 5 ? 
                              t('vendorView.activeAgency', 'Active Agency') : 
                              t('vendorView.lowActivityAgency', 'Low Activity Agency')}
                          </div>
                        </div>
                        <div className="stats-grid-container">
                          <div className="stat-box">
                            <div className="stat-box-label">{t('vendorView.newListings', 'New listings')}</div>
                            <div className="stat-box-value">{selectedVendor?.nuevos_al_mes ?? 0}</div>
                            <div className="stat-box-subtitle">{t('vendorView.thisMonth', 'this month')}</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-box-label">{t('vendorView.monthlyAverage', 'Monthly average')}</div>
                            <div className="stat-box-value">{selectedVendor?.promedio_mensual_6meses ?? 'N/A'}</div>
                            <div className="stat-box-subtitle">{t('vendorView.last6Months', 'last 6 months')}</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-box-label">{t('vendorView.timeOnMarket', 'Time on market')}</div>
                            <div className="stat-box-value">{selectedVendor.tiempo_medio_mercado || 'N/A'}</div>
                            <div className="stat-box-subtitle">{t('vendorView.daysAverage', 'days average')}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="vendor-detail-section">
                        <div className="section-label">{t('vendorView.propertyTypes', 'Property Types')}</div>
                        <div className="property-types-container">
                          {Object.entries(selectedVendor.tipos || {}).map(([tipo, count]) => (
                            <div key={tipo} className="property-type-card">
                              <div className="property-type-info">
                                <div className="property-type-name">{t(`propertyTypes.${tipo}`, tipo)}</div>
                                <div className="property-type-count">{count} {t('vendorView.properties', 'properties')}</div>
                              </div>
                              <div className="property-type-bar-container">
                                <div className="property-type-bar" 
                                  style={{ 
                                    width: `${(count / selectedVendor.total_propiedades) * 100}%`
                                  }} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="vendor-detail-section">
                        <div className="section-label">{t('vendorView.distributionByZone', 'Distribution by Zone')}</div>
                        <div className="zone-chart-container">
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart
                              data={Object.entries(selectedVendor.zonas || {})
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([zona, count]) => ({
                                  zona: t(`zones.${zona}`, zona),
                                  propiedades: count
                                }))}
                              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis
                                dataKey="zona"
                                tick={{ fill: '#aaa', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fill: '#aaa', fontSize: 12 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1c1c1c',
                                  border: '1px solid #444',
                                }}
                                formatter={(value) => [`${value} ${t('vendorView.properties', 'properties')}`, t('vendorView.count', 'Count')]}
                              />
                              <Bar
                                dataKey="propiedades"
                                fill="#e74c3c"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="properties-list">
                    <h4>{t('vendorView.availableProperties', 'Available Properties')}</h4>
                    {selectedVendor.propiedades.map(piso => (
                      <div 
                        key={piso.id} 
                        className="property-card"
                        onClick={() => onPisoClick(piso)}
                      >
                        <div className="property-type">{t(`propertyTypes.${piso.tipo}`, piso.tipo)}</div>
                        <div className="property-zone">{t(`zones.${piso.zona}`, piso.zona)}</div>
                        <div className="property-price">{piso.precio.toLocaleString()}€</div>
                        <div className="property-details">
                          {piso.metros}m² | {piso.habitaciones} {t('vendorView.rooms', 'rooms')} | {piso.baños} {t('vendorView.baths', 'baths')}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default VendorView;