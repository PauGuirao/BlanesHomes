import React, { useState, useEffect } from 'react';
// Remove the regular CSS import
import styles from './ComparePanel.module.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

function ComparePanel({ pisos, onRemove, onClose, visible }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [showComparisons, setShowComparisons] = useState(false);
  const [zonePrices, setZonePrices] = useState({});
  const [isLoadingZonePrices, setIsLoadingZonePrices] = useState(false);
  
  // Fetch zone prices when comparison is shown
  useEffect(() => {
    if (showComparisons && pisos.length >= 2) {
      fetchZonePrices();
    }
  }, [showComparisons, pisos]);
  
  const fetchZonePrices = async () => {
    if (!pisos || pisos.length === 0) return;
    
    setIsLoadingZonePrices(true);
    
    // Get unique zones from the properties
    const zones = [...new Set(pisos.map(piso => piso.zona))];
    const params = new URLSearchParams();
    zones.forEach(z => params.append('zonas', z));

    axios.get(`${API_URL}/precio_m2_zonas?${params.toString()}`)
    .then(response => {
      const data = response.data;
      console.log('Fetched zone prices:', data);
      setZonePrices(data);
    })
    .catch(error => {
      console.error('Error fetching zone prices:', error);
      setIsLoadingZonePrices(false);
    })
    .finally(() => {
      setIsLoadingZonePrices(false);
    });
  };
  
  if (!visible) return null;

  if (!pisos || pisos.length === 0) {
    return (
      <div className={styles.comparePanel}>
        <h2>
          Comparador
        </h2>
        <div className={styles.emptyCompare}>
          <p>No hay pisos para comparar</p>
          <p className={styles.emptyCompareHint}>Selecciona pisos en el mapa para añadirlos al comparador</p>
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

  const pricePerM2ChartData = pisos.map((piso, index) => ({
    name: `${index + 1}`,
    precioM2: Math.round(piso.precio / piso.metros),
    precioM2Estimado: Math.round(piso.precio_estimado / piso.metros)
  }));
  
  // Custom tooltip formatter for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{`Propiedad ${label}`}</p>
          <p className={styles.tooltipPrecio}>
            <span className={styles.tooltipDot} style={{ backgroundColor: '#e74c3c' }}></span>
            {`Precio: ${payload[0].value.toLocaleString()}€`}
          </p>
          <p className={styles.tooltipEstimado}>
            <span className={styles.tooltipDot} style={{ backgroundColor: '#3498db' }}></span>
            {`Estimado: ${payload[1].value.toLocaleString()}€`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Helper function to count extras for a property
  const countExtras = (piso) => {
    return [
      piso.garaje, 
      piso.piscina, 
      piso.terraza, 
      piso.ascensor, 
      piso.balcon, 
      piso.aire_acondicionado, 
      piso.jardin
    ].filter(Boolean).length;
  };

  return (
    <div className={styles.comparePanel}>
      <h2>
        Comparador
      </h2>

      <div className={styles.compareTable}>
        <div className={`${styles.compareRow} ${styles.header}`}>
          <div className={styles.compareCell}>#</div>
          <div className={styles.compareCell}>Tipo</div>
          <div className={styles.compareCell}>Metros</div>
          <div className={styles.compareCell}>Hab</div>
          <div className={styles.compareCell}>Baños</div>
          <div className={styles.compareCell}>Zona</div>
          <div className={styles.compareCell}>Precio</div>
          <div className={styles.compareCell}></div>
        </div>

        {pisos.map((piso, index) => {
          const precioM2 = Math.round(piso.precio / piso.metros);

          return (
            <div key={piso.id} className={styles.compareRow}>
              <div className={`${styles.compareCell} ${styles.index}`}>{index + 1}</div>
              <div className={styles.compareCell}>{piso.tipo}</div>
              <div className={`${styles.compareCell} ${piso.metros === maxMetros ? styles.winner : ''}`}>
                {piso.metros} m²
              </div>
              <div className={`${styles.compareCell} ${piso.habitaciones === maxHabitaciones ? styles.winner : ''}`}>
                {piso.habitaciones}
              </div>
              <div className={`${styles.compareCell} ${piso.baños === maxBaños ? styles.winner : ''}`}>
                {piso.baños}
              </div>
              <div className={styles.compareCell}>{piso.zona}</div>
              <div className={`${styles.compareCell} ${styles.price}`}>
                <div className={styles.comparePriceMain}>{piso.precio.toLocaleString()}€</div>
                <div className={styles.comparePriceM2}>
                  {precioM2.toLocaleString()}€/m²
                </div>
              </div>
              <div className={styles.compareCell}>
                <button className={styles.removeCompare} onClick={() => onRemove(piso.id)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {pisos.length >= 2 && (
        <>
          <button
            className={styles.compareButton}
            onClick={() => setShowComparisons(!showComparisons)}
          >
            {showComparisons ? 'Ocultar comparativas' : `Comparar ${pisos.length} propiedades`}
          </button>
          
          {showComparisons && (
            <div className={styles.detailedComparisons}>
              {/* Existing price comparison section */}
              <div className={styles.comparisonSection}>
                <h3>Comparativa de precios</h3>
                <div className={styles.priceComparisonContainer}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      barSize={30}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 5 }} />
                      <Bar dataKey="precio" name="Precio actual" fill="#e74c3c" />
                      <Bar dataKey="precioEstimado" name="Precio estimado (IA)" fill="#3498db" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className={styles.priceAnalysis}>
                    <h4>Análisis de precios</h4>
                    <div className={styles.priceAnalysisGrid}>
                      {pisos.map((piso, index) => {
                        const difference = piso.precio - piso.precio_estimado;
                        const percentDiff = ((difference / piso.precio_estimado) * 100).toFixed(1);
                        const isOverpriced = difference > 0;
                        const diffClass = Math.abs(percentDiff) > 10 
                          ? (isOverpriced ? styles.highlyOverpriced : styles.greatDeal)
                          : Math.abs(percentDiff) > 5
                            ? (isOverpriced ? styles.overpriced : styles.goodDeal)
                            : styles.fairPrice;
                            
                        return (
                          <div key={piso.id} className={`${styles.priceAnalysisCard} ${diffClass}`}>
                            <div className={styles.propertyIndex}>{index + 1}</div>
                            <div className={styles.propertyType}>{piso.tipo} en {piso.zona}</div>
                            <div className={styles.compactPriceInfo}>
                              <div className={styles.priceRow}>
                                <span className={styles.priceLabel}>Actual:</span>
                                <span className={styles.priceValue}>{piso.precio.toLocaleString()}€</span>
                              </div>
                              <div className={styles.priceRow}>
                                <span className={styles.priceLabel}>IA:</span>
                                <span className={styles.priceValue}>{Math.round(piso.precio_estimado).toLocaleString()}€</span>
                              </div>
                              <div className={`${styles.priceRow} ${styles.diffRow}`}>
                                <span className={styles.differenceValue}>
                                  {isOverpriced ? '+' : '-'}{Math.abs(difference).toLocaleString()}€ 
                                  ({isOverpriced ? '+' : '-'}{Math.abs(percentDiff)}%)
                                </span>
                                <span className={styles.assessmentBadge}>
                                  {Math.abs(percentDiff) <= 5 && "Justo"}
                                  {isOverpriced && percentDiff > 10 && "Sobrevalorado"}
                                  {isOverpriced && percentDiff > 5 && percentDiff <= 10 && "Algo caro"}
                                  {!isOverpriced && Math.abs(percentDiff) > 10 && "Oportunidad"}
                                  {!isOverpriced && Math.abs(percentDiff) > 5 && Math.abs(percentDiff) <= 10 && "Buen precio"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Price comparison summary */}
                  <div className={styles.priceComparisonSummary}>
                    <div className={styles.summaryTitle}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                      </svg>
                      Conclusiones
                    </div>
                    <div className={styles.summaryContent}>
                      {(() => {
                        // Find the most fairly priced property
                        const fairestProperty = [...pisos].sort((a, b) => {
                          const diffA = Math.abs((a.precio - a.precio_estimado) / a.precio_estimado);
                          const diffB = Math.abs((b.precio - b.precio_estimado) / b.precio_estimado);
                          return diffA - diffB;
                        })[0];
                        
                        // Find the most overpriced property
                        const mostOverpriced = [...pisos].sort((a, b) => {
                          const diffA = (a.precio - a.precio_estimado) / a.precio_estimado;
                          const diffB = (b.precio - b.precio_estimado) / b.precio_estimado;
                          return diffB - diffA;
                        })[0];
                        
                        // Find the best bargain
                        const bestBargain = [...pisos].sort((a, b) => {
                          const diffA = (a.precio - a.precio_estimado) / a.precio_estimado;
                          const diffB = (b.precio - b.precio_estimado) / b.precio_estimado;
                          return diffA - diffB;
                        })[0];
                        
                        // Get the indices for display
                        const fairestIndex = pisos.findIndex(p => p.id === fairestProperty.id) + 1;
                        const overPricedIndex = pisos.findIndex(p => p.id === mostOverpriced.id) + 1;
                        const bargainIndex = pisos.findIndex(p => p.id === bestBargain.id) + 1;
                        
                        // Calculate percentages
                        const fairestDiff = Math.abs(((fairestProperty.precio - fairestProperty.precio_estimado) / fairestProperty.precio_estimado) * 100).toFixed(1);
                        const overPricedDiff = (((mostOverpriced.precio - mostOverpriced.precio_estimado) / mostOverpriced.precio_estimado) * 100).toFixed(1);
                        const bargainDiff = (((bestBargain.precio_estimado - bestBargain.precio) / bestBargain.precio_estimado) * 100).toFixed(1);
                        
                        return (
                          <>
                            La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightFair}`}>{fairestIndex}</span> tiene el precio más equilibrado 
                            (diferencia de {fairestDiff}% respecto a la estimación).
                            
                            {mostOverpriced.precio > mostOverpriced.precio_estimado && (
                              <> La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightOverpriced}`}>{overPricedIndex}</span> es 
                              la más sobrevalorada con un {overPricedDiff}% por encima del precio estimado.</>
                            )}
                            
                            {bestBargain.precio < bestBargain.precio_estimado && bargainDiff > 5 && (
                              <> La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightBargain}`}>{bargainIndex}</span> ofrece 
                              la mejor oportunidad con un {bargainDiff}% por debajo del precio estimado.</>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* New price per m² comparison section */}
              <div className={styles.comparisonSection}>
                <h3>Comparativa de precio por m²</h3>
                <div className={styles.priceComparisonContainer}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={pricePerM2ChartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      barSize={30}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<PricePerM2Tooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 5 }} />
                      <Bar dataKey="precioM2" name="Precio/m² actual" fill="#e74c3c" />
                      <Bar dataKey="precioM2Estimado" name="Precio/m² estimado" fill="#3498db" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className={styles.priceAnalysis}>
                    <h4>Análisis de precio por m²</h4>
                    <div className={styles.priceAnalysisGrid}>
                      {pisos.map((piso, index) => {
                        const precioM2 = Math.round(piso.precio / piso.metros);
                        const precioM2Estimado = Math.round(piso.precio_estimado / piso.metros);
                        const difference = precioM2 - precioM2Estimado;
                        const percentDiff = ((difference / precioM2Estimado) * 100).toFixed(1);
                        const isOverpriced = difference > 0;
                        const diffClass = Math.abs(percentDiff) > 10 
                          ? (isOverpriced ? styles.highlyOverpriced : styles.greatDeal)
                          : Math.abs(percentDiff) > 5
                            ? (isOverpriced ? styles.overpriced : styles.goodDeal)
                            : styles.fairPrice;
                            
                        return (
                          <div key={piso.id} className={`${styles.priceAnalysisCard} ${diffClass}`}>
                            <div className={styles.propertyIndex}>{index + 1}</div>
                            <div className={styles.propertyType}>{piso.tipo} en {piso.zona}</div>
                            <div className={styles.compactPriceInfo}>
                              <div className={styles.priceRow}>
                                <span className={styles.priceLabel}>Actual/m²:</span>
                                <span className={styles.priceValue}>{precioM2.toLocaleString()}€</span>
                              </div>
                              <div className={styles.priceRow}>
                                <span className={styles.priceLabel}>IA/m²:</span>
                                <span className={styles.priceValue}>{precioM2Estimado.toLocaleString()}€</span>
                              </div>
                              <div className={`${styles.priceRow} ${styles.diffRow}`}>
                                <span className={styles.differenceValue}>
                                  {isOverpriced ? '+' : '-'}{Math.abs(difference).toLocaleString()}€ 
                                  ({isOverpriced ? '+' : '-'}{Math.abs(percentDiff)}%)
                                </span>
                                <span className={styles.assessmentBadge}>
                                  {Math.abs(percentDiff) <= 5 && "Justo"}
                                  {isOverpriced && percentDiff > 10 && "Sobrevalorado"}
                                  {isOverpriced && percentDiff > 5 && percentDiff <= 10 && "Algo caro"}
                                  {!isOverpriced && Math.abs(percentDiff) > 10 && "Oportunidad"}
                                  {!isOverpriced && Math.abs(percentDiff) > 5 && Math.abs(percentDiff) <= 10 && "Buen precio"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Price per m² comparison summary */}
                  <div className={styles.priceComparisonSummary}>
                    <div className={styles.summaryTitle}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                      </svg>
                      Conclusiones
                    </div>
                    <div className={styles.summaryContent}>
                      {(() => {
                        // Find property with lowest price per m²
                        const lowestPriceM2 = [...pisos].sort((a, b) => {
                          return (a.precio / a.metros) - (b.precio / b.metros);
                        })[0];
                        
                        // Find property with highest price per m²
                        const highestPriceM2 = [...pisos].sort((a, b) => {
                          return (b.precio / b.metros) - (a.precio / a.metros);
                        })[0];
                        
                        // Find the most fairly priced property per m²
                        const fairestPropertyM2 = [...pisos].sort((a, b) => {
                          const precioM2A = a.precio / a.metros;
                          const precioM2EstimadoA = a.precio_estimado / a.metros;
                          const precioM2B = b.precio / b.metros;
                          const precioM2EstimadoB = b.precio_estimado / b.metros;
                          
                          const diffA = Math.abs((precioM2A - precioM2EstimadoA) / precioM2EstimadoA);
                          const diffB = Math.abs((precioM2B - precioM2EstimadoB) / precioM2EstimadoB);
                          return diffA - diffB;
                        })[0];
                        
                        // Get the indices for display
                        const lowestIndex = pisos.findIndex(p => p.id === lowestPriceM2.id) + 1;
                        const highestIndex = pisos.findIndex(p => p.id === highestPriceM2.id) + 1;
                        const fairestIndex = pisos.findIndex(p => p.id === fairestPropertyM2.id) + 1;
                        
                        // Calculate values for display
                        const lowestValue = Math.round(lowestPriceM2.precio / lowestPriceM2.metros).toLocaleString();
                        const highestValue = Math.round(highestPriceM2.precio / highestPriceM2.metros).toLocaleString();
                        const priceDiff = (((highestPriceM2.precio / highestPriceM2.metros) / (lowestPriceM2.precio / lowestPriceM2.metros)) * 100 - 100).toFixed(1);
                        
                        const fairestM2 = Math.round(fairestPropertyM2.precio / fairestPropertyM2.metros);
                        const fairestM2Estimado = Math.round(fairestPropertyM2.precio_estimado / fairestPropertyM2.metros);
                        const fairestDiff = Math.abs(((fairestM2 - fairestM2Estimado) / fairestM2Estimado) * 100).toFixed(1);
                        
                        return (
                          <>
                            <p>
                              La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightBargain} ${styles.highlightBargain}`}>{lowestIndex}</span> tiene 
                              el precio por m² más bajo ({lowestValue}€/m²), mientras que la 
                              <span className={`${styles.summaryHighlight} ${styles.highlightOverpriced}`}>{highestIndex}</span> tiene 
                              el más alto ({highestValue}€/m²), una diferencia del {priceDiff}%.
                            </p>
                            
                            <p>
                              La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightFair}`}>{fairestIndex}</span> tiene 
                              el precio por m² más equilibrado respecto a su estimación (diferencia de {fairestDiff}%).
                            </p>
                            
                            {lowestPriceM2.zona === highestPriceM2.zona ? (
                              <p>
                                Ambas propiedades están en la misma zona ({lowestPriceM2.zona}), lo que sugiere que otros factores 
                                como la calidad, estado o características específicas están influyendo en la diferencia de precio.
                              </p>
                            ) : (
                              <p>
                                La diferencia de precio por m² refleja el contraste entre las zonas 
                                ({lowestPriceM2.zona} vs {highestPriceM2.zona}).
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* New zone price comparison section */}
              <div className={styles.comparisonSection}>
                <h3>Comparativa con precios de zona</h3>
                <div className={styles.zoneComparisonContainer}>
                  {isLoadingZonePrices ? (
                    <div className={styles.loadingIndicator}>Cargando precios de zona...</div>
                  ) : (
                    <>
                      <div className={styles.zoneComparisonTable}>
                        <div className={`${styles.zoneCompareRow} ${styles.header}`}>
                          <div className={styles.zoneCompareCell}>#</div>
                          <div className={styles.zoneCompareCell}>Zona</div>
                          <div className={styles.zoneCompareCell}>Precio/m²</div>
                          <div className={styles.zoneCompareCell}>Media zona</div>
                          <div className={styles.zoneCompareCell}>Diferencia</div>
                        </div>
                        
                        {pisos.map((piso, index) => {
                          const precioM2 = Math.round(piso.precio / piso.metros);
                          const zonaData = zonePrices[piso.zona];
                          const zonaPrecioM2 = zonaData?.precio_m2_medio;
                          const diff = zonaPrecioM2 ? ((precioM2 / zonaPrecioM2) * 100 - 100).toFixed(1) : 'N/A';
                          const diffClass = zonaPrecioM2 ? 
                            (diff > 10 ? styles.overpriced : 
                             diff < -10 ? styles.greatDeal : 
                             diff > 5 ? styles.slightlyOverpriced : 
                             diff < -5 ? styles.goodDeal : 
                             styles.fairPrice) : '';
                          
                          return (
                            <div key={piso.id} className={styles.zoneCompareRow}>
                              <div className={`${styles.zoneCompareCell} ${styles.index}`}>{index + 1}</div>
                              <div className={styles.zoneCompareCell}>{piso.zona}</div>
                              <div className={styles.zoneCompareCell}>{precioM2.toLocaleString()}€/m²</div>
                              <div className={styles.zoneCompareCell}>
                                {zonaPrecioM2 ? `${Math.round(zonaPrecioM2).toLocaleString()}€/m²` : 'No disponible'}
                              </div>
                              <div className={`${styles.zoneCompareCell} ${diffClass}`}>
                                {diff !== 'N/A' ? (
                                  <>
                                    {diff > 0 ? '+' : ''}{diff}%
                                    <span className={styles.assessmentLabel}>
                                      {diff > 20 && "Muy por encima"}
                                      {diff > 10 && diff <= 20 && "Por encima"}
                                      {diff > 5 && diff <= 10 && "Ligeramente por encima"}
                                      {diff >= -5 && diff <= 5 && "En la media"}
                                      {diff < -5 && diff >= -10 && "Ligeramente por debajo"}
                                      {diff < -10 && diff >= -20 && "Por debajo"}
                                      {diff < -20 && "Muy por debajo"}
                                    </span>
                                  </>
                                ) : 'N/A'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {Object.keys(zonePrices).length > 0 && (
                        <div className={styles.zoneComparisonChart}>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={pisos.map((piso, index) => {
                                const precioM2 = Math.round(piso.precio / piso.metros);
                                const zonaPrecioM2 = zonePrices[piso.zona].precio_m2_medio || 0;
                                
                                return {
                                  name: `${index + 1}`,
                                  precioM2: precioM2,
                                  mediaZona: Math.round(zonaPrecioM2),
                                  zona: piso.zona
                                };
                              })}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const diff = data.mediaZona ? ((data.precioM2 / data.mediaZona) * 100 - 100).toFixed(1) : 'N/A';
                                    
                                    return (
                                      <div className={styles.customTooltip}>
                                        <p className={styles.tooltipLabel}>{`Propiedad ${data.name} (${data.zona})`}</p>
                                        <p className={styles.tooltipPrecio}>
                                          <span className={styles.tooltipDot} style={{ backgroundColor: '#e74c3c' }}></span>
                                          {`Precio/m²: ${data.precioM2.toLocaleString()}€`}
                                        </p>
                                        <p className={styles.tooltipEstimado}>
                                          <span className={styles.tooltipDot} style={{ backgroundColor: '#3498db' }}></span>
                                          {`Media zona: ${data.mediaZona.toLocaleString()}€`}
                                        </p>
                                        {diff !== 'N/A' && (
                                          <p className={styles.tooltipDiff}>
                                            {`Diferencia: ${diff > 0 ? '+' : ''}${diff}%`}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend />
                              <Bar dataKey="precioM2" name="Precio/m²" fill="#e74c3c" />
                              <Bar dataKey="mediaZona" name="Media de la zona" fill="#3498db" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      
                      <div className={styles.zoneComparisonSummary}>
                        <div className={styles.summaryTitle}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                          </svg>
                          Conclusiones
                        </div>
                        <div className={styles.summaryContent}>
                          {(() => {
                            // Find properties with significant price differences from zone average
                            const propertiesWithZonePrices = pisos.map((piso, index) => {
                              const precioM2 = Math.round(piso.precio / piso.metros);
                              const zonaData = zonePrices[piso.zona];
                              const zonaPrecioM2 = zonaData?.precio_m2_medio;
                              if (!zonaPrecioM2) return null;
                              
                              const diff = ((precioM2 / zonaPrecioM2) * 100 - 100);
                              return {
                                index: index + 1,
                                id: piso.id,
                                zona: piso.zona,
                                precioM2,
                                zonaPrecioM2,
                                diff,
                                tipo: piso.tipo
                              };
                            }).filter(Boolean);
                            
                            if (propertiesWithZonePrices.length === 0) {
                              return <p>No hay datos suficientes para comparar con los precios de zona.</p>;
                            }
                            
                            // Find most overpriced and underpriced properties
                            const sortedByDiff = [...propertiesWithZonePrices].sort((a, b) => b.diff - a.diff);
                            const mostOverpriced = sortedByDiff[0];
                            const mostUnderpriced = sortedByDiff[sortedByDiff.length - 1];
                            
                            // Find property closest to zone average
                            const closestToAverage = [...propertiesWithZonePrices].sort((a, b) => 
                              Math.abs(a.diff) - Math.abs(b.diff)
                            )[0];
                            
                            return (
                              <>
                                {mostOverpriced && mostOverpriced.diff > 5 && (
                                  <p>
                                    La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightOverpriced}`}>
                                      {mostOverpriced.index}
                                    </span> ({mostOverpriced.tipo} en {mostOverpriced.zona}) está un <strong>{mostOverpriced.diff.toFixed(1)}%</strong> por encima 
                                    del precio medio de su zona ({Math.round(mostOverpriced.zonaPrecioM2).toLocaleString()}€/m²).
                                  </p>
                                )}
                                
                                {mostUnderpriced && mostUnderpriced.diff < -5 && (
                                  <p>
                                    La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightBargain}`}>
                                      {mostUnderpriced.index}
                                    </span> ({mostUnderpriced.tipo} en {mostUnderpriced.zona}) está un <strong>{Math.abs(mostUnderpriced.diff).toFixed(1)}%</strong> por debajo 
                                    del precio medio de su zona ({Math.round(mostUnderpriced.zonaPrecioM2).toLocaleString()}€/m²).
                                  </p>
                                )}
                                
                                {closestToAverage && Math.abs(closestToAverage.diff) <= 5 && (
                                  <p>
                                    La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightFair}`}>
                                      {closestToAverage.index}
                                    </span> tiene un precio muy cercano a la media de su zona 
                                    (solo {closestToAverage.diff > 0 ? '+' : ''}{closestToAverage.diff.toFixed(1)}% de diferencia).
                                  </p>
                                )}
                                
                                {propertiesWithZonePrices.some(p => p.diff < -15) && (
                                  <p>
                                    Las propiedades con precios significativamente por debajo de la media de su zona 
                                    podrían representar buenas oportunidades de inversión, aunque conviene revisar su estado y características.
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Existing extras comparison section */}
              <div className={styles.comparisonSection}>
                <h3>Comparativa de extras</h3>
                <div className={styles.extrasComparisonContainer}>
                  <div className={styles.extrasGrid}>
                    {pisos.map((piso, index) => (
                      <div key={piso.id} className={styles.extrasCard}>
                        <div className={styles.propertyIndex}>{index + 1}</div>
                        <div className={styles.propertyType}>{piso.tipo} en {piso.zona}</div>
                        
                        <div className={styles.extrasList}>
                          <div className={`${styles.extraItem} ${piso.garaje ? styles.hasExtra : styles.noExtra}`}>
                            <span className={styles.extraIcon}>🚗</span>
                            <span className={styles.extraName}>Garaje</span>
                            <span className={styles.extraStatus}>{piso.garaje ? '✓' : '✕'}</span>
                          </div>
                          
                          <div className={`${styles.extraItem} ${piso.piscina ? styles.hasExtra : styles.noExtra}`}>
                            <span className={styles.extraIcon}>🏊</span>
                            <span className={styles.extraName}>Piscina</span>
                            <span className={styles.extraStatus}>{piso.piscina ? '✓' : '✕'}</span>
                          </div>
                          
                          <div className={`${styles.extraItem} ${piso.terraza ? styles.hasExtra : styles.noExtra}`}>
                            <span className={styles.extraIcon}>🏞️</span>
                            <span className={styles.extraName}>Terraza</span>
                            <span className={styles.extraStatus}>{piso.terraza ? '✓' : '✕'}</span>
                          </div>
                          
                          <div className={`${styles.extraItem} ${piso.ascensor ? styles.hasExtra : styles.noExtra}`}>
                            <span className={styles.extraIcon}>🔼</span>
                            <span className={styles.extraName}>Ascensor</span>
                            <span className={styles.extraStatus}>{piso.ascensor ? '✓' : '✕'}</span>
                          </div>
                          
                          <div className={`${styles.extraItem} ${piso.balcon ? styles.hasExtra : styles.noExtra}`}>
                            <span className={styles.extraIcon}>🏙️</span>
                            <span className={styles.extraName}>Balcón</span>
                            <span className={styles.extraStatus}>{piso.balcon ? '✓' : '✕'}</span>
                          </div>
                          
                          <div className={`${styles.extraItem} ${piso.aire_acondicionado ? styles.hasExtra : styles.noExtra}`}>
                            <span className={styles.extraIcon}>❄️</span>
                            <span className={styles.extraName}>A/C</span>
                            <span className={styles.extraStatus}>{piso.aire_acondicionado ? '✓' : '✕'}</span>
                          </div>
                          
                          <div className={`${styles.extraItem} ${piso.jardin ? styles.hasExtra : styles.noExtra}`}>
                            <span className={styles.extraIcon}>🌳</span>
                            <span className={styles.extraName}>Jardín</span>
                            <span className={styles.extraStatus}>{piso.jardin ? '✓' : '✕'}</span>
                          </div>
                        </div>
                        
                        <div className={styles.extrasSummary}>
                          <span className={styles.extrasCount}>{countExtras(piso)} extras</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Extras comparison summary */}
                  <div className={styles.extrasComparisonSummary}>
                    <div className={styles.summaryTitle}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                      </svg>
                      Conclusiones
                    </div>
                    <div className={styles.summaryContent}>
                      {(() => {
                        // Find property with most extras
                        const extrasCount = pisos.map(piso => ({
                          id: piso.id,
                          count: countExtras(piso)
                        }));
                        
                        const mostExtras = [...extrasCount].sort((a, b) => b.count - a.count)[0];
                        const leastExtras = [...extrasCount].sort((a, b) => a.count - b.count)[0];
                        
                        const mostExtrasIndex = pisos.findIndex(p => p.id === mostExtras.id) + 1;
                        const leastExtrasIndex = pisos.findIndex(p => p.id === leastExtras.id) + 1;
                        
                        // Find most common and rare extras
                        const extrasPresence = {
                          garaje: pisos.filter(p => p.garaje).length,
                          piscina: pisos.filter(p => p.piscina).length,
                          terraza: pisos.filter(p => p.terraza).length,
                          ascensor: pisos.filter(p => p.ascensor).length,
                          balcon: pisos.filter(p => p.balcon).length,
                          aire_acondicionado: pisos.filter(p => p.aire_acondicionado).length,
                          jardin: pisos.filter(p => p.jardin).length
                        };
                        
                        const extrasNames = {
                          garaje: "Garaje",
                          piscina: "Piscina",
                          terraza: "Terraza",
                          ascensor: "Ascensor",
                          balcon: "Balcón",
                          aire_acondicionado: "A/C",
                          jardin: "Jardín"
                        };
                        
                        const mostCommonExtra = Object.entries(extrasPresence)
                          .filter(([_, count]) => count > 0)
                          .sort(([_, countA], [__, countB]) => countB - countA)[0];
                          
                        const rareExtra = Object.entries(extrasPresence)
                          .filter(([_, count]) => count > 0 && count < pisos.length)
                          .sort(([_, countA], [__, countB]) => countA - countB)[0];
                        
                        return (
                          <>
                            <p>
                              La propiedad <span className={`${styles.summaryHighlight} ${styles.highlightBargain}`}>{mostExtrasIndex}</span> tiene 
                              la mayor cantidad de extras ({mostExtras.count}).
                              {mostExtras.count !== leastExtras.count && (
                                <> Mientras que la <span className={`${styles.summaryHighlight} ${styles.highlightOverpriced}`}>{leastExtrasIndex}</span> tiene 
                                la menor cantidad ({leastExtras.count}).</>
                              )}
                            </p>
                            
                            {mostCommonExtra && (
                              <p>
                                El extra más común es <span className={`${styles.summaryHighlight} ${styles.highlightFair}`}>
                                {extrasNames[mostCommonExtra[0]]}</span> (presente en {mostCommonExtra[1]} de {pisos.length} propiedades).
                              </p>
                            )}
                            
                            {rareExtra && (
                              <p>
                                El extra menos común es <span className={`${styles.summaryHighlight} ${styles.highlightFair}`}>
                                {extrasNames[rareExtra[0]]}</span> (presente en solo {rareExtra[1]} de {pisos.length} propiedades).
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ComparePanel;

// Custom tooltip for price per m² chart
const PricePerM2Tooltip = ({ active, payload, label }) => {
if (active && payload && payload.length) {
  return (
  <div className={styles.customTooltip}>
    <p className={styles.tooltipLabel}>{`Propiedad ${label}`}</p>
    <p className={styles.tooltipPrecio}>
      <span className={styles.tooltipDot} style={{ backgroundColor: '#e74c3c' }}></span>
      {`Precio/m²: ${payload[0].value.toLocaleString()}€`}
    </p>
    <p className={styles.tooltipEstimado}>
      <span className={styles.tooltipDot} style={{ backgroundColor: '#3498db' }}></span>
      {`Estimado/m²: ${payload[1].value.toLocaleString()}€`}
    </p>
  </div>
  );
}
return null;
};
