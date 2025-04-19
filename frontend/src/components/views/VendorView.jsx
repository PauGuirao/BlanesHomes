import { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generalStats, setGeneralStats] = useState({});

  useEffect(() => {
    axios.get('http://localhost:8000/vendedores')
      .then(response => {
        setVendors(response.data.vendedores);
        setGeneralStats(response.data.stats);
        calculateGeneralStats(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching vendors:', error);
        setLoading(false);
      });
  }, []);

  const loadVendorDetails = (nombre) => {
    setLoading(true);
    axios.get(`http://localhost:8000/vendedor/${encodeURIComponent(nombre)}`)
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
      <h2>Agency Overview</h2>
      
      <div className="zona-stats">
        <div className="stat-group">
          <h3>General Statistics</h3>
          <div className="stat-item">
            <span className="stat-label">Total Agencies</span>
            <span className="stat-value">{generalStats.total_agencias}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Private Sellers</span>
            <span className="stat-value">{generalStats.particulares}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Properties</span>
            <span className="stat-value">{generalStats.total_propiedades}</span>
          </div>
        </div>

        <div className="stat-group">
          <h3>Market Leader</h3>
          <div className="stat-item">
            <span className="stat-label">Agency</span>
            <span className="stat-value">{generalStats.agencia_dominante?.nombre}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Properties</span>
            <span className="stat-value">{generalStats.agencia_dominante?.propiedades}</span>
          </div>
        </div>
      </div>

      <h3>Real Estate Agencies</h3>
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
                    {vendor.total_propiedades} properties
                  </div>
                </div>
                <div className="vendor-stats">
                  <div className="stat-row">
                    <span>Avg. Price:</span>
                    <span>{vendor.precio_medio.toLocaleString()}€</span>
                  </div>
                  <div className="stat-row">
                    <span>Avg. Size:</span>
                    <span>{vendor.metros_medio}m²</span>
                  </div>
                </div>
              </div>
              {selectedVendor && selectedVendor.nombre === vendor.nombre && (
                <>
                  <div className="vendor-detail-compact">
                    <div className="vendor-detail-left">
                      <div className="vendor-detail-title">
                        Details for {selectedVendor.nombre}
                      </div>
                      <div className="compact-stat">
                        <div className="compact-label">Price Range</div>
                        <div className="compact-value">
                          {selectedVendor.precio_min.toLocaleString()}€ - {selectedVendor.precio_max.toLocaleString()}€
                        </div>
                      </div>
                      <div className="compact-stat">
                        <div className="compact-label">Property Types</div>
                        <div className="compact-value">
                          {Object.entries(selectedVendor.tipos).map(([tipo, count]) => (
                            <span key={tipo}>{tipo}: {count}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="vendor-detail-right">
                      <div className="compact-label">Distribution by Zone</div>
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart
                          data={Object.entries(selectedVendor.zonas).map(([zona, count]) => ({
                            zona,
                            propiedades: count
                          }))}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis
                            dataKey="zona"
                            tick={{ fill: '#aaa', fontSize: 11 }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: '#aaa', fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1c1c1c',
                              border: '1px solid #444',
                            }}
                            formatter={(value) => `${value} properties`}
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
                  <div className="properties-list">
                    <h4>Available Properties</h4>
                    {selectedVendor.propiedades.map(piso => (
                      <div 
                        key={piso.id} 
                        className="property-card"
                        onClick={() => onPisoClick(piso)}
                      >
                        <div className="property-type">{piso.tipo}</div>
                        <div className="property-zone">{piso.zona}</div>
                        <div className="property-price">{piso.precio.toLocaleString()}€</div>
                        <div className="property-details">
                          {piso.metros}m² | {piso.habitaciones} rooms | {piso.baños} baths
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