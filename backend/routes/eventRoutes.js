// Importación de dependencias
const express = require('express');
const router = express.Router();

// Importación del controlador de eventos
const eventController = require('../controllers/eventControllers');

// Importación de middlewares de autenticación y roles
const { authJwt, role } = require('../middlewares');

/* 
  Configuración de rutas:
  - Las primeras 2 rutas son públicas (no requieren autenticación)
  - Las siguientes rutas son protegidas con diferentes niveles de acceso
*/

// Rutas públicas (accesibles sin autenticación)
router.get('/', eventController.getAllEvents);          // Obtener todos los eventos
router.get('/:id', eventController.getEventById);       // Obtener un evento específico por ID

// Rutas protegidas (requieren autenticación y roles específicos)
router.post('/',                                        // Crear un nuevo evento
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador'])],  // Middlewares: token válido + rol admin/coordinador
  eventController.createEvent
);

router.put('/:id',                                     // Actualizar un evento existente
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador'])],  // Mismos requisitos que creación
  eventController.updateEvent
);

router.delete('/:id',                                   // Eliminar un evento
  [authJwt.verifyToken, role.isAdmin],                  // Requiere token válido + rol de admin
  eventController.deleteEvent
);

// Exportar el router configurado
module.exports = router;