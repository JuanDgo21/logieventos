import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import FeatureCard from './FeatureCard';

const FeaturesSection = () => {
  const features = [
    {
      title: 'Automatizar la gestión de eventos',
      description:
        'Evita errores y duplicidades. Controla fechas, recursos y personal en tiempo real.',
      icon: 'bi-calendar-check',
    },
    {
      title: 'Optimizar recursos logísticos',
      description:
        'Asigna mobiliario, sonido, alimentos y proveedores sin sobrecargas ni fallos.',
      icon: 'bi-box-seam',
    },
    {
      title: 'Gestionar contratos y pagos',
      description:
        'Digitaliza acuerdos, lleva el control de asistencias y genera reportes financieros al instante.',
      icon: 'bi-file-earmark-text',
    },
    {
      title: 'Tomar decisiones con datos',
      description:
        'Accede a reportes automáticos en PDF sobre costos, asistencia y rentabilidad.',
      icon: 'bi-graph-up',
    },
  ];

  return (
    <section id="features" className="py-5 bg-light">
      <Container>
        <h2 className="text-center mb-5">¿Qué puedes hacer con LogiEventos?</h2>
        <Row>
          {features.map((feature, index) => (
            <Col key={index} md={6} lg={3} className="mb-4">
              <FeatureCard {...feature} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default FeaturesSection;