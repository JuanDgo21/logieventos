import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const WhyChooseUs = () => {
  const benefits = [
    {
      icon: "✨",
      title: "Reducción de errores",
      description: "Evita duplicidades y malentendidos"
    },
    {
      icon: "✨",
      title: "Ahorro de tiempo",
      description: "Di adiós a Excel y a los procesos manuales"
    },
    {
      icon: "✨",
      title: "Escalabilidad",
      description: "Desde reuniones pequeñas hasta eventos masivos"
    },
    {
      icon: "✨",
      title: "Acceso 24/7",
      description: "Disponible desde cualquier dispositivo y lugar"
    },
    {
      icon: "✨",
      title: "Interfaz intuitiva",
      description: "Diseñada para facilitar la experiencia del usuario"
    }
  ];

  return (
    <section className="py-5">
      <Container>
        <Row className="justify-content-center mb-5">
          <Col lg={8} className="text-center">
            <h2 className="mb-3">🌟 ¿Por qué elegir LogiEventos?</h2>
            <p className="lead">
              Donde la organización de eventos se convierte en eficiencia
            </p>
          </Col>
        </Row>
        <Row>
          {benefits.map((benefit, index) => (
            <Col md={4} className="mb-4" key={index}>
              <div className="d-flex">
                <div className="me-3 fs-2">{benefit.icon}</div>
                <div>
                  <h3 className="h5">{benefit.title}</h3>
                  <p className="text-muted mb-0">{benefit.description}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default WhyChooseUs;