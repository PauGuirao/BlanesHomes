import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import LandingMap from './LandingMap';
import AdAnalysisFeature from './AdAnalysisFeature';


const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-navbar-logo">
          <Link to="/">
            <img src="/images/logo2.png" alt="Habinia Logo" className="logo-icon" />
            <span className="logo-main">HABIN</span>
            <span className="logo-gradient">IA</span>
          </Link>
        </div>
        <button 
          className="mobile-menu-button" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Características</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Precios</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <Link to="/login" className="navbar-login" onClick={() => setMobileMenuOpen(false)}>Iniciar sesión</Link>
          <Link to="/register" className="navbar-register" onClick={() => setMobileMenuOpen(false)}>Registrarse</Link>
        </div>
      </nav>

      {/* Rest of the component remains unchanged */}
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Domina tu mercado inmobiliario con IA y datos 🔥</h1>
          <ul className="hero-features">
            <li>Valora propiedades con precisión usando IA y datos en tiempo real</li>
            <li>Optimiza tus anuncios para conseguir más visitas y ventas más rápidas</li>
            <li>Identifica oportunidades de inversión antes que la competencia</li>
            <li>Genera informes profesionales para tus clientes con un solo clic</li>
          </ul>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Comenzar ahora</Link>
            <a href="#pricing" className="btn btn-secondary">Ver planes</a>
          </div>
        </div>
        <div className="hero-image">
          <img 
            src="/images/hero-right.webp" 
            alt="Habinia Dashboard App" 
            className="hero-image-3d"
            width="600"
            height="450"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* Detailed Features */}
      <section className="detailed-features" id='features'>
        <div className="detailed-feature">
          <h2>Valora tus propiedades en segundos</h2>
          <p className="feature-description">Obtén valoraciones precisas basadas en miles de datos del mercado local y algoritmos avanzados de inteligencia artificial.</p>
          
          <div className="feature-showcase">
            <div className="feature-form">
              <h3>Datos de la propiedad</h3>
              <div className="form-simulation">
                <div className="form-row">
                  <div className="form-group">
                    <label>Ubicación</label>
                    <div className="form-input">Blanes Centro</div>
                  </div>
                  <div className="form-group">
                    <label>Superficie</label>
                    <div className="form-input">85 m²</div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Habitaciones</label>
                    <div className="form-input">3</div>
                  </div>
                  <div className="form-group">
                    <label>Baños</label>
                    <div className="form-input">2</div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Antigüedad</label>
                    <div className="form-input">15 años</div>
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <div className="form-input">Buen estado</div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Extras</label>
                    <div className="form-input">Balcón, Ascensor</div>
                  </div>
                  <div className="form-group">
                    <label>Planta</label>
                    <div className="form-input">3ª</div>
                  </div>
                </div>
                <div className="form-button">Calcular precio</div>
              </div>
            </div>
            
            <div className="feature-result">
              <div className="prediction-result">
                <h3>Valoración estimada</h3>
                <div className="price-prediction">
                  <div className="predicted-price">235.000€</div>
                  <div className="price-range">±5% (223.250€ - 246.750€)</div>
                </div>
                
                <div className="prediction-confidence">
                  <div className="confidence-bar">
                    <div className="confidence-level" style={{width: '92%'}}></div>
                  </div>
                  <span>92% de confianza</span>
                </div>
                
                <h4>Propiedades similares</h4>
                <div className="similar-properties">
                  <div className="similar-property">
                    <div className="property-image"></div>
                    <div className="property-details">
                      <div className="property-price">229.000€</div>
                      <div className="property-specs">82m² · 3 hab · 2 baños</div>
                      <div className="property-location">Blanes Centro</div>
                    </div>
                  </div>
                  <div className="similar-property">
                    <div className="property-image"></div>
                    <div className="property-details">
                      <div className="property-price">242.500€</div>
                      <div className="property-specs">90m² · 3 hab · 2 baños</div>
                      <div className="property-location">Blanes Centro</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Feature Section */}
      <LandingMap />

      {/* New Feature: Analiza tus anuncios */}
      <AdAnalysisFeature />

      {/* Testimonials */}
      <section className="testimonials">
        <h2>Lo que dicen nuestros clientes</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"HABINIA ha transformado completamente nuestra agencia. Ahora podemos ofrecer valoraciones precisas y vender propiedades un 30% más rápido."</p>
            </div>
            <div className="testimonial-author">
              <div>
                <h3 className="author-name">María García</h3>
                <p>Directora, Inmobiliaria Costa</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"La herramienta de análisis de anuncios nos ha permitido mejorar nuestras descripciones y destacar frente a la competencia. Totalmente recomendado."</p>
            </div>
            <div className="testimonial-author">
              <div>
                <h3 className="author-name">Carlos Martínez</h3>
                <p>Agente Inmobiliario</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Gracias a HABINIA hemos identificado oportunidades de inversión que antes pasábamos por alto. Ha sido una inversión que se ha pagado sola."</p>
            </div>
            <div className="testimonial-author">
              <div>
                <h3 className="author-name">Laura Sánchez</h3>
                <p>Inversora Inmobiliaria</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing" id="pricing">
        <h2>Planes y precios</h2>
        <p className="pricing-subtitle">Elige el plan que mejor se adapte a tus necesidades</p>
        
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Básico</h3>
              <div className="pricing-price">
                <span className="price">€19</span>
                <span className="period">por mes</span>
              </div>
              <div className="pricing-billing">
                Facturado anualmente €228
                <br />6+ meses gratis
              </div>
            </div>
            
            <div className="pricing-features">
              <div className="feature">
                <span className="check">✓</span> Hasta 10 propiedades
              </div>
              <div className="feature">
                <span className="check">✓</span> 1 usuario
              </div>
              <div className="feature">
                <span className="check">✓</span> Análisis básico
              </div>
              <div className="feature">
                <span className="check">✓</span> Soporte por email
              </div>
            </div>
            
            <Link to="/register" className="subscribe-button">Comenzar</Link>
          </div>
          
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Pro</h3>
              <div className="pricing-price">
                <span className="price">€39</span>
                <span className="period">por mes</span>
              </div>
              <div className="pricing-billing">
                Facturado anualmente €468
                <br />6+ meses gratis
              </div>
            </div>
            
            <div className="pricing-features">
              <div className="feature">
                <span className="check">✓</span> Propiedades ilimitadas
              </div>
              <div className="feature">
                <span className="check">✓</span> 3 usuarios
              </div>
              <div className="feature">
                <span className="check">✓</span> Análisis avanzado
              </div>
              <div className="feature">
                <span className="check">✓</span> Soporte prioritario
              </div>
              <div className="feature">
                <span className="check">✓</span> Exportación de informes
              </div>
            </div>
            
            <Link to="/register" className="subscribe-button">Comenzar</Link>
          </div>
          
          <div className="pricing-card premium">
            <div className="most-popular">Más popular</div>
            <div className="pricing-header">
              <h3>Premium</h3>
              <div className="pricing-price">
                <span className="price">€59</span>
                <span className="period">por mes</span>
              </div>
              <div className="pricing-billing">
                Facturado anualmente €708
                <br />6+ meses gratis
              </div>
            </div>
            
            <div className="pricing-features">
              <div className="feature">
                <span className="check">✓</span> Propiedades ilimitadas
              </div>
              <div className="feature">
                <span className="check">✓</span> 10 usuarios
              </div>
              <div className="feature">
                <span className="check">✓</span> Análisis completo
              </div>
              <div className="feature">
                <span className="check">✓</span> Soporte 24/7
              </div>
              <div className="feature">
                <span className="check">✓</span> API integración
              </div>
              <div className="feature">
                <span className="check">✓</span> Herramientas avanzadas
              </div>
            </div>
            
            <Link to="/register" className="subscribe-button">Comenzar</Link>
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="faq" id='faq'>
        <h2>Preguntas frecuentes</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>¿Cómo funciona el análisis de propiedades?</h3>
            <p>Nuestro algoritmo analiza miles de propiedades similares en la misma zona, teniendo en cuenta factores como tamaño, características, antigüedad y tendencias de mercado para ofrecer una valoración precisa.</p>
          </div>
          <div className="faq-item">
            <h3>¿Puedo cancelar mi suscripción en cualquier momento?</h3>
            <p>Sí, puedes cancelar tu suscripción cuando quieras. Si cancelas, mantendrás el acceso hasta el final del período facturado.</p>
          </div>
          <div className="faq-item">
            <h3>¿Necesito conocimientos técnicos para usar la plataforma?</h3>
            <p>No, nuestra plataforma está diseñada para ser intuitiva y fácil de usar. Además, ofrecemos tutoriales y soporte para ayudarte en todo momento.</p>
          </div>
          <div className="faq-item">
            <h3>¿Cómo se integra con mis anuncios existentes?</h3>
            <p>Puedes importar tus anuncios desde las principales plataformas inmobiliarias o añadirlos manualmente. También ofrecemos una API para integraciones personalizadas en los planes superiores.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Comienza a optimizar tus anuncios hoy mismo</h2>
        <p>Únete a cientos de profesionales inmobiliarios que ya están aprovechando el poder de los datos para vender más y mejor.</p>
        <Link to="/register" className="btn btn-primary">Prueba gratis por 14 días</Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
        <div className="footer-logo">
            <img src="/images/logo2.png" alt="Habinia Logo" className="footer-logo-img" />
            <div className="logo-text">
              <span className="logo-main">HABIN</span>
              <span className="logo-gradient">IA</span>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Producto</h4>
              <ul>
                <li><a href="#features">Características</a></li>
                <li><a href="#pricing">Precios</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Empresa</h4>
              <ul>
                <li><a href="/about">Sobre nosotros</a></li>
                <li><a href="/contact">Contacto</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><a href="/privacy">Privacidad</a></li>
                <li><a href="/terms">Términos</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Habinia. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;