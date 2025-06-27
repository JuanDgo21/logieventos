// Importamos componentes de Bootstrap
import { Container, Row, Col } from 'react-bootstrap';

// Importamos Link de React Router para navegación interna
import { Link } from 'react-router-dom';

// Importamos íconos de FontAwesome (íconos sólidos y de marcas)
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt,
  faCalendarDays,
  faArrowUp
} from '@fortawesome/free-solid-svg-icons';
import { 
  faFacebookF, 
  faTwitter, 
  faLinkedinIn, 
  faInstagram 
} from '@fortawesome/free-brands-svg-icons';

// Componente principal del pie de página
export default function Footer() {
  // Función para hacer scroll suave hasta la parte superior
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer py-5 position-relative bg-gradient-dark">
      <Container className="position-relative">

        {/* Columna 1: Logo y descripción */}
        <Row>
          <Col lg={4} className="mb-5 mb-lg-0">
            <div className="d-flex align-items-center mb-4">
              <div className="bg-white bg-opacity-10 text-white rounded-circle p-2 me-2">
                <FontAwesomeIcon icon={faCalendarDays} />
              </div>
              <h5 className="fw-bold mb-0 text-white">LogiEventos</h5>
            </div>
            <p className="small text-white-70 mb-4">
              Plataforma para la gestión y planificación profesional de eventos.
            </p>

            {/* Íconos de redes sociales */}
            <div className="d-flex gap-3">
              <a href="#" className="text-white text-decoration-none hover-text-primary fs-5">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" className="text-white text-decoration-none hover-text-primary fs-5">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#" className="text-white text-decoration-none hover-text-primary fs-5">
                <FontAwesomeIcon icon={faLinkedinIn} />
              </a>
              <a href="#" className="text-white text-decoration-none hover-text-primary fs-5">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
          </Col>

          {/* Columna 2: Enlaces rápidos */}
          <Col md={6} lg={4} className="mb-4 mb-md-0">
            <h5 className="mb-4 fw-bold text-white">Enlaces rápidos</h5>
            <Row>
              <Col xs={6}>
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <Link to="/" className="text-white-70 text-decoration-none hover-text-primary d-flex align-items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="me-2 rotate-270" />
                      Inicio
                    </Link>
                  </li>
                  <li className="mb-3">
                    <a href="#features" className="text-white-70 text-decoration-none hover-text-primary d-flex align-items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="me-2 rotate-270" />
                      Características
                    </a>
                  </li>
                  <li className="mb-3">
                    <a href="#modules" className="text-white-70 text-decoration-none hover-text-primary d-flex align-items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="me-2 rotate-270" />
                      Módulos
                    </a>
                  </li>
                </ul>
              </Col>
              <Col xs={6}>
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <a href="#" className="text-white-70 text-decoration-none hover-text-primary d-flex align-items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="me-2 rotate-270" />
                      Precios
                    </a>
                  </li>
                  <li className="mb-3">
                    <a href="#" className="text-white-70 text-decoration-none hover-text-primary d-flex align-items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="me-2 rotate-270" />
                      Blog
                    </a>
                  </li>
                  <li className="mb-3">
                    <a href="#" className="text-white-70 text-decoration-none hover-text-primary d-flex align-items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="me-2 rotate-270" />
                      Contacto
                    </a>
                  </li>
                </ul>
              </Col>
            </Row>
          </Col>

          {/* Columna 3: Información de contacto */}
          <Col md={6} lg={4}>
            <h5 className="mb-4 fw-bold text-white">Contacto</h5>
            <ul className="list-unstyled text-white-70 small">
              <li className="mb-3 d-flex align-items-start">
                <FontAwesomeIcon icon={faEnvelope} className="me-3 mt-1 text-white" />
                info@logieventos.com
              </li>
              <li className="mb-3 d-flex align-items-start">
                <FontAwesomeIcon icon={faPhone} className="me-3 mt-1 text-white" />
                +57 123 456 7890
              </li>
              <li className="d-flex align-items-start">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-3 mt-1 text-white" />
                Bogotá, Colombia
              </li>
            </ul>
          </Col>
        </Row>

        {/* Separador y derechos de autor */}
        <hr className="my-5 border-white-10" />
        <div className="text-center small text-white-60">
          &copy; {new Date().getFullYear()} LogiEventos. Todos los derechos reservados.
        </div>

        {/* Botón flotante para volver arriba */}
        <button 
          onClick={scrollToTop}
          className="position-absolute end-0 bottom-0 bg-primary text-white border-0 rounded-circle p-2 mb-3 me-3 d-flex align-items-center justify-content-center"
          style={{ width: '40px', height: '40px' }}
          aria-label="Volver arriba"
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      </Container>
    </footer>
  );
}
