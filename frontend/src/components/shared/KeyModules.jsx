import React from 'react';
import { Container, Accordion } from 'react-bootstrap';

const KeyModules = () => {
  const modules = [
    {
      title: 'Gestión de Usuarios y Roles',
      content: (
        <ul>
          <li>Registro e inicio de sesión seguro</li>
          <li>Roles personalizados: Administrador, Coordinador, Proveedor, Personal, Líder de Evento</li>
          <li>Recuperación de contraseña y permisos según funciones</li>
          <li>Edición de perfil y control de accesos</li>
        </ul>
      ),
    },
    {
      title: 'Eventos y Calendario Interactivo',
      content: (
        <ul>
          <li>Crea y edita eventos con disponibilidad en tiempo real</li>
          <li>Visualiza fechas ocupadas y libres en un calendario dinámico</li>
          <li>Asigna tipo de evento, lugar y detalles desde una única vista</li>
        </ul>
      ),
    },
    // Agregar los demás módulos aquí...
  ];

  return (
    <section id="modules" className="py-5">
      <Container>
        <h2 className="text-center mb-5">Módulos Clave</h2>
        <Accordion defaultActiveKey="0" flush>
          {modules.map((module, index) => (
            <Accordion.Item key={index} eventKey={index.toString()}>
              <Accordion.Header>{module.title}</Accordion.Header>
              <Accordion.Body>{module.content}</Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Container>
    </section>
  );
};

export default KeyModules;