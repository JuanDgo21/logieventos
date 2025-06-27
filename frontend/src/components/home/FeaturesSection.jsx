// Importamos los componentes necesarios desde React-Bootstrap para la estructura del layout
import { Container, Row, Col } from 'react-bootstrap';

// Importamos el componente para mostrar íconos desde FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Importamos los íconos específicos que vamos a usar en las tarjetas de funcionalidades
import { 
  faRocket, 
  faCogs,
  faFileContract,
  faChartPie,
  faUsersCog,
  faCalendarCheck,
  faStar
} from '@fortawesome/free-solid-svg-icons';

// Este componente muestra una sección de características o funcionalidades de la aplicación
export default function FeaturesSection() {

  // Arreglo de objetos que representa cada funcionalidad (ícono, título y descripción)
  const features = [
    {
      icon: faRocket,
      title: "Automatizar la gestión de eventos",
      description: "Evita errores y duplicidades. Controla fechas, recursos y personal en tiempo real."
    },
    {
      icon: faCogs,
      title: "Optimizar recursos logísticos",
      description: "Asigna mobiliario, sonido, alimentos y proveedores sin sobrecargas ni fallos."
    },
    {
      icon: faFileContract,
      title: "Gestionar contratos y pagos",
      description: "Digitaliza acuerdos, lleva el control de asistencias y genera reportes financieros al instante."
    },
    {
      icon: faChartPie,
      title: "Tomar decisiones con datos",
      description: "Accede a reportes automáticos en PDF sobre costos, asistencia y rentabilidad."
    },
    {
      icon: faUsersCog,
      title: "Gestión de equipos",
      description: "Coordina a tu equipo de trabajo con asignaciones claras y seguimiento en tiempo real."
    },
    {
      icon: faCalendarCheck,
      title: "Confirmaciones automáticas",
      description: "Envía confirmaciones automáticas a clientes y proveedores."
    }
  ];

  // Retornamos el JSX que representa la sección de funcionalidades
  return (
    <section className="section bg-white position-relative" id="features">
      {/* Contenedor principal con padding automático y centrado */}
      <Container className="position-relative">
        
        {/* Título de la sección con ícono decorativo */}
        <div className="section-title">
          <h2>
            <FontAwesomeIcon icon={faStar} className="me-3 text-primary" />
            ¿Qué puedes hacer con LogiEventos?
          </h2>
          <p>Descubre cómo nuestra plataforma transforma tu gestión de eventos</p>
        </div>
        
        {/* Fila para organizar las tarjetas en columnas */}
        <Row className="g-4">
          {/* Recorremos el arreglo de funcionalidades y generamos una tarjeta por cada una */}
          {features.map((feature, index) => (
            <Col key={index} md={6} lg={4}>
              {/* Tarjeta individual con estilos de sombra, borde y padding */}
              <div className="h-100 bg-white p-4 rounded-3 shadow-sm border-top border-4 border-primary">
                
                {/* Ícono decorativo dentro de un círculo de color */}
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 mb-4" 
                     style={{width: '60px', height: '60px'}}>
                  <FontAwesomeIcon icon={feature.icon} size="lg" />
                </div>

                {/* Título de la funcionalidad */}
                <h3 className="h4 mb-3">{feature.title}</h3>
                
                {/* Descripción corta de la funcionalidad */}
                <p className="text-muted mb-0">{feature.description}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
