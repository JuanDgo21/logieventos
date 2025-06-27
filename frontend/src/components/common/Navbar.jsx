// Importamos el hook useEffect para manejar efectos secundarios
import { useEffect } from 'react';

// Importamos componentes de Bootstrap
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

// Importamos íconos de FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarDays,    // Ícono para el logo
  faHome,            // Ícono para "Inicio"
  faStar,            // Ícono para "Características"
  faLayerGroup,      // Ícono para "Módulos"
  faTags,            // Ícono para "Precios"
  faEnvelope,        // Ícono para "Contacto"
  faSignInAlt,       // Ícono para "Iniciar Sesión"
  faUserPlus         // Ícono para "Registrarse"
} from '@fortawesome/free-solid-svg-icons';

// Importamos Link para navegación interna con React Router
import { Link } from 'react-router-dom';

// Componente de navegación principal
export default function AppNavbar() {

  // useEffect se ejecuta cuando el componente se monta
  useEffect(() => {
    // Función que agrega una clase "scrolled" al navbar cuando se hace scroll
    const handleScroll = () => {
      if (window.scrollY > 50) {
        document.querySelector('.navbar').classList.add('scrolled');
      } else {
        document.querySelector('.navbar').classList.remove('scrolled');
      }
    };

    // Escuchamos el evento de scroll
    window.addEventListener('scroll', handleScroll);

    // Limpiamos el evento cuando el componente se desmonta
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    // Navbar responsive con Bootstrap
    <Navbar expand="lg" className="py-2 shadow-sm bg-white">
      <Container>

        {/* Logo de la aplicación con ícono y texto */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center me-lg-5">
          <div className="bg-primary text-white rounded-circle p-3 me-2" 
               style={{
                 width: '44px', 
                 height: '44px', 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center'
               }}>
            <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: '1.25rem' }} />
          </div>
          <span className="fw-bold fs-4 text-dark">LogiEventos</span>
        </Navbar.Brand>

        {/* Botón para mostrar el menú en pantallas pequeñas */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 px-2">
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>

        {/* Contenedor del menú de navegación */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto">

            {/* Enlaces de navegación internos y secciones de la misma página */}
            <Nav.Link as={Link} to="/" className="mx-2 fw-medium px-3 py-2 d-flex align-items-center">
              <FontAwesomeIcon icon={faHome} className="me-2" /> Inicio
            </Nav.Link>
            <Nav.Link href="#features" className="mx-2 fw-medium px-3 py-2 d-flex align-items-center">
              <FontAwesomeIcon icon={faStar} className="me-2" /> Características
            </Nav.Link>
            <Nav.Link href="#modules" className="mx-2 fw-medium px-3 py-2 d-flex align-items-center">
              <FontAwesomeIcon icon={faLayerGroup} className="me-2" /> Módulos
            </Nav.Link>
            <Nav.Link href="#" className="mx-2 fw-medium px-3 py-2 d-flex align-items-center">
              <FontAwesomeIcon icon={faTags} className="me-2" /> Precios
            </Nav.Link>
            <Nav.Link href="#" className="mx-2 fw-medium px-3 py-2 d-flex align-items-center">
              <FontAwesomeIcon icon={faEnvelope} className="me-2" /> Contacto
            </Nav.Link>
          </Nav>

          {/* Botones de inicio de sesión y registro, alineados a la derecha */}
          <div className="d-flex gap-3 mt-3 mt-lg-0">
            <Button 
              as={Link} 
              to="/login" 
              variant="outline-primary" 
              className="px-3 fw-medium d-flex align-items-center"
            >
              <FontAwesomeIcon icon={faSignInAlt} className="me-2" /> Iniciar Sesión
            </Button>

            <Button 
              as={Link} 
              to="/register" 
              variant="primary" 
              className="px-3 fw-medium shadow d-flex align-items-center"
            >
              <FontAwesomeIcon icon={faUserPlus} className="me-2" /> Registrarse
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
