//  Importamos componentes de Bootstrap para maquetación
import { Container, Row, Col, Button, ListGroup } from 'react-bootstrap';

//  Importamos iconos de FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, 
  faPlayCircle,
  faCheckCircle,
  faChartLine,
  faClock,
  faExpand,
  faMobileScreen,
  faCalendarCheck,
  faUsers,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { 
  faGoogle, 
  faMicrosoft, 
  faSlack 
} from '@fortawesome/free-brands-svg-icons';

//  Componente principal que muestra la sección introductoria (Hero)
export default function HeroSection() {
  //  Lista de beneficios que se mostrará como puntos destacados
  const benefits = [
    { icon: faCheckCircle, text: 'Reducción de errores' },
    { icon: faClock, text: 'Ahorro de tiempo' },
    { icon: faExpand, text: 'Escalabilidad' },
    { icon: faMobileScreen, text: 'Acceso 24/7' },
    { icon: faShieldAlt, text: 'Seguridad garantizada' },
    { icon: faUsers, text: 'Gestión de equipos integrada' }
  ];

  return (
    <section className="hero-section position-relative overflow-hidden py-5">
      
      {/*  Fondos decorativos con círculos de color */}
      <div className="position-absolute top-0 start-0 w-100 h-100">
        <div className="position-absolute top-0 end-0 bg-primary bg-opacity-05 rounded-circle" 
             style={{width: '600px', height: '600px', transform: 'translate(30%, -30%)'}}></div>
        <div className="position-absolute bottom-0 start-0 bg-secondary bg-opacity-05 rounded-circle" 
             style={{width: '400px', height: '400px', transform: 'translate(-30%, 30%)'}}></div>
      </div>
      
      {/*  Contenedor principal de Bootstrap */}
      <Container className="position-relative">
        <Row className="align-items-center">
          
          {/*  Columna izquierda con título, descripción y botones */}
          <Col lg={6} className="pe-lg-5 mb-5 mb-lg-0">
            
            {/*  Título principal con icono */}
            <div className="d-flex align-items-center mb-4">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                <FontAwesomeIcon icon={faCalendarCheck} size="lg" />
              </div>
              <h1 className="mb-0">Planifica, controla y optimiza tus eventos</h1>
            </div>
            
            {/*  Descripción principal con ícono */}
            <p className="lead mb-4 d-flex align-items-center">
              <FontAwesomeIcon icon={faChartLine} className="me-3 text-primary" />
              Con LogiEventos, tu plataforma web todo en uno, organizar eventos nunca fue tan fácil. 
              Automatiza procesos, gestiona recursos y toma decisiones basadas en datos.
            </p>
            
            {/*  Lista de beneficios visuales */}
            <ListGroup variant="flush" className="mb-5">
              {benefits.map((benefit, index) => (
                <ListGroup.Item 
                  key={index} 
                  className="border-0 ps-0 bg-transparent py-2"
                >
                  <FontAwesomeIcon icon={benefit.icon} className="me-3 text-primary" />
                  <span className="fw-medium">{benefit.text}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
            
            {/*  Botones de llamada a la acción */}
            <div className="d-flex flex-wrap gap-3 mb-5">
              <Button variant="primary" size="lg" className="px-4 shadow d-flex align-items-center">
                Comenzar ahora <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
              </Button>
              <Button variant="outline-primary" size="lg" className="px-4 d-flex align-items-center">
                <FontAwesomeIcon icon={faPlayCircle} className="me-2" />
                Ver demo
              </Button>
            </div>
            
            {/*  Logos de empresas que confían en el sistema */}
            <div className="d-flex align-items-center flex-wrap gap-3">
              <span className="text-muted small">Confían en nosotros:</span>
              <div className="d-flex gap-3">
                <FontAwesomeIcon icon={faGoogle} className="text-muted fs-4" />
                <FontAwesomeIcon icon={faMicrosoft} className="text-muted fs-4" />
                <FontAwesomeIcon icon={faSlack} className="text-muted fs-4" />
              </div>
            </div>
          </Col>
          
          {/*  Columna derecha con tarjeta de beneficios adicionales */}
          <Col lg={6} className="position-relative">
            
            {/*  Tarjeta con fondo tipo glassmorphism */}
            <div className="glass p-5 rounded-3 animate-fadein" style={{animationDelay: '0.3s'}}>
              <div className="d-flex align-items-center mb-4">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                  <FontAwesomeIcon icon={faUsers} size="lg" />
                </div>
                <h3 className="mb-0">¿Por qué elegir LogiEventos?</h3>
              </div>
              
              {/* Lista de características adicionales */}
              <ul className="list-unstyled">
                {[
                  "Automatización de procesos repetitivos",
                  "Integración con herramientas populares",
                  "Soporte técnico 24/7",
                  "Actualizaciones constantes",
                  "Interfaz intuitiva y fácil de usar",
                  "Reportes personalizables"
                ].map((item, index) => (
                  <li key={index} className="mb-3 d-flex align-items-start">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3 flex-shrink-0">
                      <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/*  Tarjeta flotante con número de eventos */}
            <div className="position-absolute bottom-0 end-0 bg-white p-3 rounded-3 shadow-sm animate-float" 
                 style={{width: '120px', transform: 'translate(-20%, 20%)', animationDelay: '0.5s'}}>
              <div className="text-center">
                <div className="fs-3 fw-bold text-primary">+500</div>
                <div className="small text-muted">Eventos</div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
