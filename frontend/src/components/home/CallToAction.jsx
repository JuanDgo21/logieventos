// Importamos componentes de Bootstrap para la estructura y botones
import { Container, Button, Row, Col } from 'react-bootstrap';

// Importamos el componente para mostrar íconos
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Importamos los íconos que usaremos en esta sección
import { 
  faArrowRight,       // Ícono de flecha (para el botón "Registrarse")
  faPlayCircle,       // Ícono de "play" (para el botón "Ver demo")
  faRocket,           // Ícono de cohete (para resaltar la transformación)
  faHandshake         // Ícono de apretón de manos (representa alianza o acuerdo)
} from '@fortawesome/free-solid-svg-icons';

// Componente de llamada a la acción que invita al usuario a registrarse o ver la demo
export default function CallToAction() {
  return (
    <section className="cta-section py-5 position-relative overflow-hidden bg-primary">
      {/* Elementos decorativos de fondo (círculos con íconos semitransparentes) */}
      <div className="position-absolute top-0 start-0 w-100 h-100">
        
        {/* Círculo decorativo con ícono de cohete en la esquina superior izquierda */}
        <div className="position-absolute top-0 start-0 bg-white bg-opacity-10 rounded-circle" 
             style={{width: '300px', height: '300px', transform: 'translate(-30%, -30%)'}}>
          <FontAwesomeIcon 
            icon={faRocket} 
            className="text-white opacity-25 position-absolute"
            style={{fontSize: '5rem', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}
          />
        </div>

        {/* Círculo decorativo con ícono de apretón de manos en la esquina inferior derecha */}
        <div className="position-absolute bottom-0 end-0 bg-white bg-opacity-10 rounded-circle" 
             style={{width: '400px', height: '400px', transform: 'translate(30%, 30%)'}}>
          <FontAwesomeIcon 
            icon={faHandshake} 
            className="text-white opacity-25 position-absolute"
            style={{fontSize: '6rem', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}
          />
        </div>
      </div>
      
      {/* Contenedor principal centrado */}
      <Container className="position-relative">
        {/* Fila con columnas para título y botones */}
        <Row className="align-items-center py-4">
          
          {/* Columna izquierda: título y descripción */}
          <Col lg={8} className="mb-4 mb-lg-0 text-center text-lg-start">
            <h2 className="text-white mb-3 fw-bold d-flex align-items-center justify-content-center justify-content-lg-start">
              {/* Ícono visible solo en pantallas grandes */}
              <FontAwesomeIcon icon={faRocket} className="me-3 d-none d-lg-block" />
              ¿Listo para transformar tu gestión de eventos?
            </h2>
            <p className="lead text-white mb-0 d-flex align-items-center justify-content-center justify-content-lg-start">
              {/* Ícono visible solo en pantallas pequeñas */}
              <FontAwesomeIcon icon={faHandshake} className="me-2 d-lg-none" />
              Regístrate ahora y descubre cómo LogiEventos puede simplificar tu trabajo.
            </p>
          </Col>

          {/* Columna derecha: botones de acción */}
          <Col lg={4} className="text-center text-lg-end">
            {/* Botón principal: Registrarse */}
            <Button 
              variant="light" 
              size="lg" 
              className="px-4 shadow me-3 mb-3 mb-lg-0 d-flex align-items-center mx-auto ms-lg-0 me-lg-3"
            >
              Registrarse <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </Button>

            {/* Botón secundario: Ver demo */}
            <Button 
              variant="outline-light" 
              size="lg" 
              className="px-4 d-flex align-items-center mx-auto me-lg-0"
            >
              <FontAwesomeIcon icon={faPlayCircle} className="me-2" />
              Ver demo
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
