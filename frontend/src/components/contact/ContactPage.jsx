import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ submitted: false, error: null });
    
    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormStatus({ submitted: true, error: null });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setFormStatus({ submitted: false, error: 'Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.' });
    }
  };

  return (
    <div className="contact-container">
      <header className="contact-header">
        <div className="logo-container">
          <img src="/images/logo2.png" alt="Habinia Logo" className="contact-logo" />
          <div className="logo-text">
            <span className="logo-main">HABIN</span>
            <span className="logo-gradient">IA</span>
          </div>
        </div>
        <nav className="contact-nav">
          <Link to="/" className="nav-link">Inicio</Link>
          <Link to="/about" className="nav-link">Sobre Nosotros</Link>
          <Link to="/contact" className="nav-link active">Contacto</Link>
        </nav>
      </header>

      <main className="contact-content">
        <section className="contact-hero">
          <h1>Contacta con nosotros</h1>
          <p className="contact-subtitle">Estamos aquí para ayudarte con cualquier pregunta o consulta sobre nuestros servicios.</p>
        </section>

        <section className="contact-form-section">
          <div className="form-container">
            <h2>Envíanos un mensaje</h2>
            
            {formStatus.submitted ? (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <h3>¡Mensaje enviado con éxito!</h3>
                <p>Gracias por contactar con nosotros. Te responderemos lo antes posible.</p>
                <button 
                  className="new-message-btn"
                  onClick={() => setFormStatus({ submitted: false, error: null })}
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                {formStatus.error && (
                  <div className="error-message">{formStatus.error}</div>
                )}
                
                <div className="contanct-form-group">
                  <label htmlFor="name">Nombre completo</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="contanct-form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="contanct-form-group">
                  <label htmlFor="subject">Asunto</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="contanct-form-group">
                  <label htmlFor="message">Mensaje</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="submit-button">Enviar mensaje</button>
              </form>
            )}
          </div>
        </section>

        <section className="faq-section">
          <h2>Preguntas frecuentes</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>¿Qué es Habinia?</h3>
              <p>Habinia es una plataforma de análisis inmobiliario que utiliza inteligencia artificial para proporcionar valoraciones precisas de propiedades y análisis de mercado.</p>
            </div>
            
            <div className="faq-item">
              <h3>¿Cómo funciona la valoración de propiedades?</h3>
              <p>Nuestro algoritmo de IA analiza miles de propiedades similares, tendencias de mercado y factores locales para proporcionar una valoración precisa basada en datos reales.</p>
            </div>
            
            <div className="faq-item">
              <h3>¿Qué ciudades están disponibles?</h3>
              <p>Actualmente operamos en Blanes y Lloret de Mar, con planes de expansión a otras ciudades de la Costa Brava y Barcelona en los próximos meses.</p>
            </div>
            
            <div className="faq-item">
              <h3>¿Cuánto cuesta usar Habinia?</h3>
              <p>Ofrecemos diferentes planes de suscripción adaptados a las necesidades de agencias inmobiliarias de todos los tamaños. Contacta con nosotros para más información.</p>
            </div>
          </div>
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

export default ContactPage;