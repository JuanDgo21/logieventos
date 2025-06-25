import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const CallToAction = () => {
  return (
    <section className="py-5 bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} className="text-center">
            <h2 className="mb-4">🚀 ¡Comienza hoy!</h2>
            <p className="lead mb-5">
              ¿Te imaginas planificar y controlar cada detalle de tus eventos desde un solo lugar?
              Con LogiEventos, la logística de tus celebraciones, conferencias o actividades empresariales 
              deja de ser un dolor de cabeza.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Button variant="primary" size="lg" as={Link} to="/demo" className="px-4">
                🔍 Solicita una Demo
              </Button>
              <Button variant="outline-primary" size="lg" as={Link} to="/register" className="px-4">
                📝 Regístrate Gratis
              </Button>
              <Button variant="secondary" size="lg" as={Link} to="/contact" className="px-4">
                📬 Contáctanos
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default CallToAction;