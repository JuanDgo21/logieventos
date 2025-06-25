import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-5">
      <Container>
        <Row>
          <Col lg={4} className="mb-4 mb-lg-0">
            <h3 className="h5 mb-3">
              <img src="/logo.svg" alt="LogiEventos" height="30" className="me-2" />
              LogiEventos
            </h3>
            <p>
              Planifica, controla y optimiza tus eventos con un solo clic.
              La solución todo en uno para la gestión profesional de eventos.
            </p>
          </Col>
          <Col md={4} lg={2} className="mb-4 mb-md-0">
            <h4 className="h6 mb-3">Enlaces</h4>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/" className="text-white-50">Inicio</Link></li>
              <li className="mb-2"><Link to="/features" className="text-white-50">Características</Link></li>
              <li className="mb-2"><Link to="/modules" className="text-white-50">Módulos</Link></li>
              <li className="mb-2"><Link to="/pricing" className="text-white-50">Precios</Link></li>
              <li className="mb-2"><Link to="/contact" className="text-white-50">Contacto</Link></li>
            </ul>
          </Col>
          <Col md={4} lg={2} className="mb-4 mb-md-0">
            <h4 className="h6 mb-3">Legal</h4>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/privacy" className="text-white-50">Privacidad</Link></li>
              <li className="mb-2"><Link to="/terms" className="text-white-50">Términos</Link></li>
              <li className="mb-2"><Link to="/cookies" className="text-white-50">Cookies</Link></li>
            </ul>
          </Col>
          <Col md={4} lg={4}>
            <h4 className="h6 mb-3">Contacto</h4>
            <ul className="list-unstyled text-white-50">
              <li className="mb-2">info@logieventos.com</li>
              <li className="mb-2">+57 123 456 7890</li>
              <li className="mb-2">Bogotá, Colombia</li>
            </ul>
          </Col>
        </Row>
        <hr className="my-4 bg-secondary" />
        <Row>
          <Col md={6} className="mb-3 mb-md-0">
            <p className="mb-0 text-white-50 small">
              © {new Date().getFullYear()} LogiEventos. Todos los derechos reservados.
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="d-inline-block me-3">
              {/* Iconos de redes sociales */}
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;