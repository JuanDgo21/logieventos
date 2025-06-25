import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

const HeroSection = () => {
  return (
    <section className="hero-section py-5 bg-primary text-white">
      <Container>
        <Row className="align-items-center">
          <Col md={6}>
            <h1 className="display-4 fw-bold mb-4">
              Planifica, controla y optimiza tus eventos con un solo clic
            </h1>
            <p className="lead mb-4">
              Con LogiEventos, tu plataforma web todo en uno, organizar eventos nunca fue tan fácil.
              Automatiza procesos, gestiona recursos y toma decisiones estratégicas basadas en datos
              reales.
            </p>
            <div className="d-flex gap-3">
              <Button variant="light" size="lg">
                Solicitar Demo
              </Button>
              <Button variant="outline-light" size="lg">
                Registrarse Gratis
              </Button>
            </div>
          </Col>
          <Col md={6}>
            {/* Aquí iría una imagen ilustrativa */}
            <div className="hero-image-placeholder bg-light rounded" style={{ height: '300px' }}></div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroSection;