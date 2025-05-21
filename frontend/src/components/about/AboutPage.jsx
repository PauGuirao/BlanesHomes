import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-container">
      <header className="about-header">
        <div className="logo-container">
          <img src="/images/logo2.png" alt="Habinia Logo" className="about-logo" />
          <div className="logo-text">
            <span className="logo-main">HABIN</span>
            <span className="logo-gradient">IA</span>
          </div>
        </div>
        <nav className="about-nav">
          <Link to="/" className="nav-link">Inicio</Link>
          <Link to="/about" className="nav-link active">Sobre Nosotros</Link>
          <Link to="/contact" className="nav-link">Contacto</Link>
        </nav>
      </header>

      <main className="about-content">
        <section className="about-hero">
          <h1>Transformando el mercado inmobiliario con inteligencia artificial</h1>
          <p className="subtitle">Conoce la historia detrás de Habinia y nuestra misión de hacer el mercado inmobiliario más transparente y accesible.</p>
        </section>

        <section className="about-mission">
          <div className="section-content">
            <h2>Nuestra Misión</h2>
            <p>En Habinia, creemos que la compra y venta de propiedades debería ser un proceso transparente, justo y basado en datos. Nuestra misión es democratizar el acceso a información inmobiliaria de calidad mediante el uso de inteligencia artificial avanzada.</p>
            <p>Proporcionamos a agentes inmobiliarios, compradores y vendedores las herramientas analíticas que necesitan para tomar decisiones informadas en un mercado complejo y en constante cambio.</p>
          </div>
          <div className="mission-image">
            <img src="/images/mission.jpg" alt="Nuestra misión" />
          </div>
        </section>

        <section className="about-story">
          <div className="story-image">
            <img src="/images/story.jpg" alt="Nuestra historia" />
          </div>
          <div className="section-content">
            <h2>Nuestra Historia</h2>
            <p>Habinia nació de la frustración compartida por nuestros fundadores al navegar por el mercado inmobiliario español. Descubrieron que la falta de transparencia y la información asimétrica hacían que fuera difícil determinar el valor justo de las propiedades.</p>
            <p>En 2023, reunimos a un equipo de expertos en tecnología, datos y bienes raíces con la visión de crear una plataforma que utilizara la inteligencia artificial para analizar el mercado inmobiliario y proporcionar valoraciones precisas y recomendaciones personalizadas.</p>
          </div>
        </section>

        {/* The about-team section has been removed */}

        <section className="about-values">
          <h2>Nuestros Valores</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🔍</div>
              <h3>Transparencia</h3>
              <p>Creemos en proporcionar información clara y precisa para que todos puedan tomar decisiones informadas.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">🤖</div>
              <h3>Innovación</h3>
              <p>Utilizamos las últimas tecnologías de IA para ofrecer soluciones que transforman el sector inmobiliario.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Accesibilidad</h3>
              <p>Trabajamos para hacer que la información inmobiliaria de calidad sea accesible para todos.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">📊</div>
              <h3>Datos con propósito</h3>
              <p>Convertimos datos complejos en información útil y accionable para nuestros usuarios.</p>
            </div>
          </div>
        </section>

        <section className="about-contact">
          <h2>Contacta con nosotros</h2>
          <p>¿Tienes preguntas o comentarios? Nos encantaría saber de ti.</p>
          <a href="mailto:info@habinia.com" className="contact-button">Envíanos un email</a>
        </section>
      </main>

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

export default AboutPage;