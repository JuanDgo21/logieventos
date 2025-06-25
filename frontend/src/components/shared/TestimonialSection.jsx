import React from 'react';
import { Container, Card } from 'react-bootstrap';

const Testimonial = () => {
  return (
    <section className="py-5 bg-primary text-white">
      <Container>
        <Card bg="transparent" border="light" className="text-center p-4 p-md-5">
          <Card.Body>
            <blockquote className="blockquote mb-0">
              <p className="fs-3 fst-italic">
                "LogiEventos hizo que coordinar nuestro festival fuera un 50% más rápido y con cero errores."
              </p>
              <footer className="blockquote-footer mt-3 text-white-50">
                Ana M., <cite>Coordinadora de Eventos</cite>
              </footer>
            </blockquote>
          </Card.Body>
        </Card>
      </Container>
    </section>
  );
};

export default Testimonial;