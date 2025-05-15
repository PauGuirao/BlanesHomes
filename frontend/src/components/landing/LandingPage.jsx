import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-logo">
          <Link to="/">BlanesHomes</Link>
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
          <h1>Análisis inmobiliario inteligente para profesionales</h1>
          <ul className="hero-features">
            <li>Valora propiedades con precisión usando IA y datos de mercado en tiempo real</li>
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
          <img src="/images/hero-right.png" alt="BlanesHomes Dashboard" className="hero-image-3d" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <h2>Potencia tu negocio inmobiliario</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Análisis de mercado</h3>
            <p>Conoce el valor real de cada propiedad con nuestro algoritmo de IA que analiza miles de datos del mercado local.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Optimización de anuncios</h3>
            <p>Mejora tus descripciones, títulos y precios con recomendaciones personalizadas basadas en datos.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Detección de oportunidades</h3>
            <p>Identifica propiedades infravaloradas y oportunidades de inversión antes que la competencia.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Informes detallados</h3>
            <p>Genera informes profesionales para tus clientes con datos precisos sobre cada propiedad y zona.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
        <h2>Cómo funciona</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Regístrate</h3>
            <p>Crea tu cuenta en menos de 2 minutos y elige el plan que mejor se adapte a tus necesidades.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Conecta tus propiedades</h3>
            <p>Importa tus anuncios o añade propiedades manualmente para comenzar a analizarlas.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Obtén insights</h3>
            <p>Recibe análisis detallados y recomendaciones para mejorar cada anuncio.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Optimiza y vende más rápido</h3>
            <p>Implementa las mejoras sugeridas y aumenta tus posibilidades de venta.</p>
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

      {/* Testimonials */}
      <section className="testimonials">
        <h2>Lo que dicen nuestros clientes</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"BlanesHomes ha transformado completamente nuestra agencia. Ahora podemos ofrecer valoraciones precisas y vender propiedades un 30% más rápido."</p>
            </div>
            <div className="testimonial-author">
              <img src="/images/testimonial1.jpg" alt="María García" />
              <div>
                <h4>María García</h4>
                <p>Directora, Inmobiliaria Costa</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"La herramienta de análisis de anuncios nos ha permitido mejorar nuestras descripciones y destacar frente a la competencia. Totalmente recomendado."</p>
            </div>
            <div className="testimonial-author">
              <img src="/images/testimonial2.jpg" alt="Carlos Martínez" />
              <div>
                <h4>Carlos Martínez</h4>
                <p>Agente Inmobiliario</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Gracias a BlanesHomes hemos identificado oportunidades de inversión que antes pasábamos por alto. Ha sido una inversión que se ha pagado sola."</p>
            </div>
            <div className="testimonial-author">
              <img src="/images/testimonial3.jpg" alt="Laura Sánchez" />
              <div>
                <h4>Laura Sánchez</h4>
                <p>Inversora Inmobiliaria</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
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
            <h3>BlanesHomes</h3>
            <p>Análisis inmobiliario inteligente</p>
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
                <li><a href="/blog">Blog</a></li>
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
          <p>&copy; {new Date().getFullYear()} BlanesHomes. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;