import React, { useState } from 'react';
import './AdAnalysisFeature.css';

const AdAnalysisFeature = () => {
  const [selectedAd, setSelectedAd] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Sample ad data with different URLs and analysis results
  const adData = [
    {
      url: "https://www.idealista.com/inmueble/98765432/",
      name: "Piso en Blanes Centro",
      score: 72,
      message: "Tu anuncio tiene potencial de mejora",
      details: [
        { label: "Título", score: 6.5, width: "65%", tip: "Añade palabras clave como \"luminoso\" o \"reformado\"" },
        { label: "Descripción", score: 7, width: "70%", tip: "Menciona la proximidad a servicios y transporte" },
        { label: "Precio", score: 8.5, width: "85%", tip: "El precio está bien ajustado al mercado actual" },
        { label: "Fotos", score: 6, width: "60%", tip: "Añade más fotos de la cocina y el baño" }
      ],
      suggestions: [
        "Añade más detalles sobre las reformas recientes",
        "Incluye información sobre la eficiencia energética",
        "Destaca la orientación y luminosidad del inmueble",
        "Mejora la calidad de las fotos del salón"
      ]
    },
    {
      url: "https://www.fotocasa.es/es/inmueble/12345678/",
      name: "Casa en Sa Carbonera",
      score: 85,
      message: "¡Buen trabajo! Tu anuncio es competitivo",
      details: [
        { label: "Título", score: 8.5, width: "85%", tip: "Incluye el número de habitaciones en el título" },
        { label: "Descripción", score: 9, width: "90%", tip: "Excelente descripción, muy completa" },
        { label: "Precio", score: 7.5, width: "75%", tip: "Considera reducir ligeramente el precio para más visitas" },
        { label: "Fotos", score: 8, width: "80%", tip: "Las fotos son buenas, añade una del jardín" }
      ],
      suggestions: [
        "Destaca más las características únicas de la propiedad",
        "Añade información sobre la comunidad y vecindario",
        "Menciona las posibilidades de reforma o ampliación",
        "Incluye un plano de la distribución"
      ]
    },
    {
      url: "https://www.pisos.com/viviendas/87654321/",
      name: "Ático en Los Pinos",
      score: 63,
      message: "Tu anuncio necesita mejoras importantes",
      details: [
        { label: "Título", score: 5, width: "50%", tip: "El título es demasiado genérico, sé más específico" },
        { label: "Descripción", score: 6, width: "60%", tip: "La descripción es muy corta, añade más detalles" },
        { label: "Precio", score: 9, width: "90%", tip: "El precio es muy competitivo" },
        { label: "Fotos", score: 4.5, width: "45%", tip: "Las fotos son de baja calidad y hay pocas" }
      ],
      suggestions: [
        "Toma nuevas fotos con mejor iluminación",
        "Escribe una descripción más detallada (mínimo 200 palabras)",
        "Destaca la terraza y las vistas en el título",
        "Añade información sobre las reformas recientes",
        "Incluye datos sobre la eficiencia energética"
      ]
    }
  ];
  
  const handleAdSelect = (index) => {
    setSelectedAd(index);
    setShowAnalysis(false);
  };
  
  const handleAnalyze = () => {
    setShowAnalysis(true);
  };
  
  return (
    <section className="detailed-features ad-analysis-section">
      <div className="detailed-feature">
        <h2>Analiza tus anuncios y mejora su rendimiento</h2>
        <p className="feature-description">Optimiza tus anuncios inmobiliarios con análisis inteligente. Identifica puntos débiles y recibe recomendaciones personalizadas para aumentar visitas y contactos.</p>
        
        <div className="url-analysis-container">
          {/* URL Form at the top */}
          <div className="url-form-container">
            <div className="form-simulation">
              <div className="form-row url-input-row">
                <div className="form-group full-width">
                  <label>URL del anuncio</label>
                  <div className="url-input-container">
                    <div className="form-input url-input">{adData[selectedAd].url}</div>
                    <div className="url-analyze-button" onClick={handleAnalyze}>Analizar</div>
                  </div>
                </div>
              </div>
              <div className="recent-urls">
                <div className="recent-url-label">Anuncios recientes:</div>
                <div className="recent-url-tags">
                  {adData.map((ad, index) => (
                    <div 
                      key={index}
                      className={`recent-url-tag ${selectedAd === index ? 'active' : ''}`}
                      onClick={() => handleAdSelect(index)}
                    >
                      {ad.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Analysis Results below */}
          {showAnalysis && (
            <div className="ad-analysis-result">
              <div className="analysis-content">
                <div className="analysis-left">
                  <div className="overall-score">
                    <div className="score-circle">
                      <div className="score-number">{adData[selectedAd].score}</div>
                      <div className="score-label">Puntuación</div>
                    </div>
                    <div className="score-message">{adData[selectedAd].message}</div>
                  </div>
                  
                  <div className="analysis-details">
                    {adData[selectedAd].details.slice(0, 2).map((detail, index) => (
                      <div className="analysis-item" key={index}>
                        <div className="analysis-label">{detail.label}</div>
                        <div className="analysis-score">
                          <div className="score-bar">
                            <div className="score-fill" style={{width: detail.width}}></div>
                          </div>
                          <div className="score-value">{detail.score}/10</div>
                        </div>
                        <div className="analysis-tip">{detail.tip}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="analysis-right">
                  <div className="analysis-details">
                    {adData[selectedAd].details.slice(2, 4).map((detail, index) => (
                      <div className="analysis-item" key={index}>
                        <div className="analysis-label">{detail.label}</div>
                        <div className="analysis-score">
                          <div className="score-bar">
                            <div className="score-fill" style={{width: detail.width}}></div>
                          </div>
                          <div className="score-value">{detail.score}/10</div>
                        </div>
                        <div className="analysis-tip">{detail.tip}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="improvement-suggestions">
                    <h4>Sugerencias de mejora</h4>
                    <ul className="suggestions-list">
                      {adData[selectedAd].suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdAnalysisFeature;