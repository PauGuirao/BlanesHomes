import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-container">
      <header className="legal-header">
        <div className="logo-container">
          <Link to="/">
            <img src="/images/logo2.png" alt="Habinia Logo" className="legal-logo" />
            <div className="logo-text">
              <span className="logo-main">HABIN</span>
              <span className="logo-gradient">IA</span>
            </div>
          </Link>
        </div>
        <nav className="legal-nav">
        <Link to="/" className="nav-link">Inicio</Link>
          <Link to="/about" className="nav-link">Sobre Nosotros</Link>
          <Link to="/contact" className="nav-link">Contacto</Link>
          <Link to="/privacy" className="nav-link active">Privacy</Link>
        </nav>
      </header>

      <main className="legal-content">
        <div className="legal-document">
          <h1>Política de Privacidad</h1>
          <p className="last-updated">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="legal-section">
            <h2>1. Introducción</h2>
            <p>En Habinia ("nosotros", "nuestro", "la Compañía"), respetamos su privacidad y nos comprometemos a proteger sus datos personales. Esta política de privacidad le informará sobre cómo cuidamos sus datos personales cuando visita nuestro sitio web (independientemente de dónde lo visite) y le informará sobre sus derechos de privacidad y cómo la ley le protege.</p>
            <p>Esta política de privacidad se aplica a la información que recopilamos a través de nuestro sitio web en <a href="https://habinia.com">habinia.com</a>, nuestra aplicación móvil, y cualquier otro servicio que ofrecemos.</p>
          </section>

          <section className="legal-section">
            <h2>2. Datos que recopilamos sobre usted</h2>
            <p>Datos personales, o información personal, significa cualquier información sobre un individuo a partir de la cual esa persona puede ser identificada. No incluye datos donde la identidad ha sido eliminada (datos anónimos).</p>
            <p>Podemos recopilar, usar, almacenar y transferir diferentes tipos de datos personales sobre usted, que hemos agrupado de la siguiente manera:</p>
            <ul>
              <li><strong>Datos de identidad</strong>: incluye nombre, apellido, nombre de usuario o identificador similar.</li>
              <li><strong>Datos de contacto</strong>: incluye dirección de facturación, dirección de entrega, dirección de correo electrónico y números de teléfono.</li>
              <li><strong>Datos financieros</strong>: incluye detalles de tarjetas de pago y cuentas bancarias.</li>
              <li><strong>Datos de transacción</strong>: incluye detalles sobre pagos hacia y desde usted, y otros detalles de productos y servicios que ha adquirido de nosotros.</li>
              <li><strong>Datos técnicos</strong>: incluye dirección de protocolo de Internet (IP), datos de inicio de sesión, tipo y versión de navegador, configuración de zona horaria y ubicación, tipos y versiones de complementos del navegador, sistema operativo y plataforma, y otra tecnología en los dispositivos que utiliza para acceder a este sitio web.</li>
              <li><strong>Datos de perfil</strong>: incluye su nombre de usuario y contraseña, compras o pedidos realizados por usted, sus intereses, preferencias, comentarios y respuestas a encuestas.</li>
              <li><strong>Datos de uso</strong>: incluye información sobre cómo utiliza nuestro sitio web, productos y servicios.</li>
              <li><strong>Datos de marketing y comunicaciones</strong>: incluye sus preferencias para recibir marketing de nuestra parte y de terceros, y sus preferencias de comunicación.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Cómo recopilamos sus datos personales</h2>
            <p>Utilizamos diferentes métodos para recopilar datos de y sobre usted, incluyendo:</p>
            <ul>
              <li><strong>Interacciones directas</strong>: Puede proporcionarnos sus datos de identidad, contacto y financieros al completar formularios o al comunicarse con nosotros por correo postal, teléfono, correo electrónico o de otra manera.</li>
              <li><strong>Tecnologías o interacciones automatizadas</strong>: A medida que interactúa con nuestro sitio web, podemos recopilar automáticamente datos técnicos sobre su equipo, acciones de navegación y patrones. Recopilamos estos datos personales mediante cookies, registros del servidor y otras tecnologías similares.</li>
              <li><strong>Terceros o fuentes disponibles públicamente</strong>: Podemos recibir datos personales sobre usted de varios terceros y fuentes públicas, como proveedores de análisis, proveedores de búsqueda, proveedores de publicidad, proveedores de información técnica, de contacto y financiera.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Cómo utilizamos sus datos personales</h2>
            <p>Solo utilizaremos sus datos personales cuando la ley nos lo permita. Más comúnmente, utilizaremos sus datos personales en las siguientes circunstancias:</p>
            <ul>
              <li>Cuando necesitemos ejecutar el contrato que estamos a punto de celebrar o hemos celebrado con usted.</li>
              <li>Cuando sea necesario para nuestros intereses legítimos (o los de un tercero) y sus intereses y derechos fundamentales no anulen esos intereses.</li>
              <li>Cuando necesitemos cumplir con una obligación legal o regulatoria.</li>
            </ul>
            <p>En general, no confiamos en el consentimiento como base legal para procesar sus datos personales, excepto en relación con el envío de comunicaciones de marketing directo de terceros a usted a través de correo electrónico o mensaje de texto.</p>
          </section>

          <section className="legal-section">
            <h2>5. Divulgación de sus datos personales</h2>
            <p>Podemos compartir sus datos personales con las partes establecidas a continuación para los fines establecidos en la sección 4 anterior:</p>
            <ul>
              <li>Proveedores de servicios que proporcionan servicios de TI y administración de sistemas.</li>
              <li>Asesores profesionales, incluidos abogados, banqueros, auditores y aseguradores.</li>
              <li>Autoridades fiscales, reguladoras y otras autoridades.</li>
              <li>Terceros a quienes podemos elegir vender, transferir o fusionar partes de nuestro negocio o nuestros activos.</li>
            </ul>
            <p>Requerimos a todos los terceros que respeten la seguridad de sus datos personales y los traten de acuerdo con la ley. No permitimos a nuestros proveedores de servicios terceros utilizar sus datos personales para sus propios fines y solo les permitimos procesar sus datos personales para fines específicos y de acuerdo con nuestras instrucciones.</p>
          </section>

          <section className="legal-section">
            <h2>6. Seguridad de datos</h2>
            <p>Hemos implementado medidas de seguridad apropiadas para evitar que sus datos personales se pierdan, utilicen o accedan de manera no autorizada, se modifiquen o divulguen accidentalmente. Además, limitamos el acceso a sus datos personales a aquellos empleados, agentes, contratistas y otros terceros que tienen una necesidad comercial de conocer. Solo procesarán sus datos personales según nuestras instrucciones y están sujetos a un deber de confidencialidad.</p>
            <p>Hemos implementado procedimientos para tratar cualquier sospecha de violación de datos personales y le notificaremos a usted y a cualquier regulador aplicable de una violación cuando estemos legalmente obligados a hacerlo.</p>
          </section>

          <section className="legal-section">
            <h2>7. Retención de datos</h2>
            <p>Solo conservaremos sus datos personales durante el tiempo que sea necesario para cumplir con los fines para los que los recopilamos, incluido el cumplimiento de cualquier requisito legal, contable o de informes.</p>
            <p>Para determinar el período de retención apropiado para los datos personales, consideramos la cantidad, naturaleza y sensibilidad de los datos personales, el riesgo potencial de daño por uso o divulgación no autorizados de sus datos personales, los fines para los que procesamos sus datos personales y si podemos lograr esos fines a través de otros medios, y los requisitos legales aplicables.</p>
          </section>

          <section className="legal-section">
            <h2>8. Sus derechos legales</h2>
            <p>Bajo ciertas circunstancias, tiene derechos bajo las leyes de protección de datos en relación con sus datos personales, incluyendo el derecho a:</p>
            <ul>
              <li>Solicitar acceso a sus datos personales.</li>
              <li>Solicitar la corrección de sus datos personales.</li>
              <li>Solicitar la eliminación de sus datos personales.</li>
              <li>Oponerse al procesamiento de sus datos personales.</li>
              <li>Solicitar la restricción del procesamiento de sus datos personales.</li>
              <li>Solicitar la transferencia de sus datos personales.</li>
              <li>Retirar el consentimiento.</li>
            </ul>
            <p>Si desea ejercer cualquiera de los derechos establecidos anteriormente, contáctenos a través de info@habinia.com.</p>
          </section>

          <section className="legal-section">
            <h2>9. Cookies</h2>
            <p>Nuestro sitio web utiliza cookies para distinguirlo de otros usuarios de nuestro sitio web. Esto nos ayuda a proporcionarle una buena experiencia cuando navega por nuestro sitio web y también nos permite mejorarlo.</p>
            <p>Puede configurar su navegador para rechazar todas o algunas cookies del navegador, o para alertarlo cuando los sitios web configuran o acceden a cookies. Si deshabilita o rechaza cookies, tenga en cuenta que algunas partes de este sitio web pueden volverse inaccesibles o no funcionar correctamente.</p>
          </section>

          <section className="legal-section">
            <h2>10. Cambios a esta política de privacidad</h2>
            <p>Nos reservamos el derecho de actualizar esta política de privacidad en cualquier momento. Publicaremos cualquier cambio en nuestro sitio web. Le recomendamos que revise esta política de privacidad periódicamente para estar informado de cómo estamos protegiendo su información.</p>
          </section>

          <section className="legal-section">
            <h2>11. Contacto</h2>
            <p>Si tiene alguna pregunta sobre esta política de privacidad o nuestras prácticas de privacidad, contáctenos en:</p>
            <p>Email: info@habinia.com</p>
            <p>Dirección: Carrer Ample, 11, 17300 Blanes, Girona, España</p>
          </section>
        </div>
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

export default PrivacyPolicy;