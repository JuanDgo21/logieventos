const express = require('express'); // Importa Express para crear rutas
const router = express.Router(); // Crea un enrutador de Express
const eventTypeController = require('../controllers/eventTypeControllers'); // Importa controladores
const { authJwt, role } = require('../middlewares'); // Importa middlewares de autenticación y roles

/**
 * ==============================================
 * RUTAS PARA TIPOS DE EVENTO
 * ==============================================
 * Base path: /api/event-types
 * Todas las rutas requieren autenticación JWT
 */

/**
 * POST / - Crear nuevo tipo de evento
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de administrador o de coordinador
 * Controlador: createEventType
 */
router.post('/', 
  [
    authJwt.verifyToken, // Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Valida roles permitidos
  ], 
  eventTypeController.createEventType // Controlador de creación
);

/**
 * GET / - Obtener todos los tipos de evento
 * Requiere:
 *  - Autenticación JWT válida
 * Acceso: Todos los roles (con filtros según rol)
 * Controlador: getAllEventTypes
 */
router.get('/', 
  authJwt.verifyToken, // Verifica token JWT
  eventTypeController.getAllEventTypes // Controlador de listado
);

/**
 * ✨ GET /:id - Obtener tipo de evento específico
 * Requiere:
 *  - Autenticación JWT válida
 * Acceso: Todos los roles (con restricciones para líderes)
 * Controlador: getEventTypeById
 */
router.get('/:id', 
  authJwt.verifyToken, // Verifica token JWT
  eventTypeController.getEventTypeById // Controlador de detalle
);

/**
 * PUT /:id - Actualizar tipo de evento
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de administrador y coordinador
 * Controlador: updateEventType
 */
router.put('/:id', 
  [
    authJwt.verifyToken, // Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Valida roles permitidos
  ], 
  eventTypeController.updateEventType // Controlador de actualización
);

/**
 * DELETE /:id - Eliminar tipo de evento
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de administrador
 * Validación: Verifica que no esté en uso
 * Controlador: deleteEventType
 */
router.delete('/:id', 
  [
    authJwt.verifyToken, // Verifica token JWT
    role.isAdmin // Valida que el usuario sea admin
  ], 
  eventTypeController.deleteEventType // Controlador de eliminación
);

// Exporta el enrutador para usarlo en la aplicación principal
module.exports = router;