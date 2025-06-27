//  Importamos componentes de diseño desde React-Bootstrap
import { Container, Accordion, Row, Col } from 'react-bootstrap';

//  Importamos íconos desde Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers,
  faCalendarAlt,
  faBoxOpen,
  faUserTie,
  faChartPie,
  faChevronDown,
  faDatabase,
  faFileInvoice,
  faBellConcierge
} from '@fortawesome/free-solid-svg-icons';

//  Componente que representa la sección de "Módulos"
export default function ModulesSection() {
  //  Lista de módulos que se mostrarán en el acordeón
  const modules = [
    {
      icon: faUsers,
      title: "Gestión de Usuarios y Roles",
      content: "Registro e inicio de sesión seguro. Roles personalizados: Administrador, Coordinador, Proveedor, Personal, Líder de Evento."
    },
    {
      icon: faCalendarAlt,
      title: "Eventos y Calendario Interactivo",
      content: "Crea y edita eventos con disponibilidad en tiempo real. Visualiza fechas ocupadas y libres en un calendario dinámico."
    },
    {
      icon: faBoxOpen,
      title: "Inventario y Proveedores",
      content: "Controla recursos como sonido, mobiliario y catering. Asignación automática de proveedores según disponibilidad."
    },
    {
      icon: faUserTie,
      title: "Gestión de Personal",
      content: "Registra personal (meseros, técnicos, animadores). Asigna turnos por evento y gestiona asistencia."
    },
    {
      icon: faChartPie,
      title: "Reportes Inteligentes",
      content: "Descarga contratos, inventarios y registros en segundos. Reportes por evento, recurso o personal."
    },
    {
      icon: faBellConcierge,
      title: "Servicios Adicionales",
      content: "Gestiona catering, transporte y alojamiento. Todo integrado en un solo lugar."
    }
  ];

  return (
    //  Sección principal con ID "modules", útil para navegación con anclas
    <section id="modules" className="section bg-light position-relative">
      <Container className="position-relative">
        
        {/*  Título de sección */}
        <div className="section-title text-center">
          {/*  Icono decorativo centrado */}
          <div className="d-inline-block bg-primary bg-opacity-10 text-primary rounded-circle p-3 mb-4">
            <FontAwesomeIcon icon={faDatabase} size="2x" />
          </div>
          <h2>Módulos clave</h2>
          <p className="lead">Todas las herramientas que necesitas en un solo lugar</p>
        </div>

        {/*  Estructura responsive con filas y columnas */}
        <Row>
          {/*  Columna centrada y con ancho limitado en pantallas grandes */}
          <Col lg={{ span: 10, offset: 1 }}>
            
            {/*  Componente acordeón para mostrar y ocultar contenido */}
            <Accordion flush>
              {/*  Recorremos cada módulo para renderizar un item del acordeón */}
              {modules.map((module, index) => (
                <Accordion.Item 
                  key={index}
                  eventKey={index.toString()} //  clave única para funcionamiento interno
                  className="mb-3 border-0 rounded-3 overflow-hidden shadow-sm"
                >
                  {/*  Título del acordeón con ícono, texto y flecha */}
                  <Accordion.Header className="bg-white p-4">
                    <div className="d-flex align-items-center w-100">
                      {/* Icono del módulo dentro de un círculo */}
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3 flex-shrink-0">
                        <FontAwesomeIcon icon={module.icon} size="lg" />
                      </div>

                      {/* Título del módulo */}
                      <div className="me-auto">
                        <h3 className="h5 mb-0">{module.title}</h3>
                      </div>

                      {/* Flechita decorativa (no funcional) */}
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className="text-primary transition-all accordion-arrow" 
                      />
                    </div>
                  </Accordion.Header>

                  {/*  Contenido del acordeón (desplegable) */}
                  <Accordion.Body className="bg-white p-4 pt-0">
                    <div className="d-flex">
                      {/* Icono de documento a la izquierda */}
                      <div className="flex-shrink-0 me-3 pt-1 text-primary">
                        <FontAwesomeIcon icon={faFileInvoice} />
                      </div>

                      {/* Texto descriptivo del módulo */}
                      <p className="mb-0">{module.content}</p>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
