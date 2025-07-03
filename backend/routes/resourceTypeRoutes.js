const express = require('express'); // Importa Express para crear rutas
const router = express.Router(); // Crea un enrutador de Express
const resourceTypeController = require('../controllers/resourceTypeControllers'); // Importa los controladores
const { authJwt, role } = require('../middlewares'); // Importa middlewares de autenticación y roles

/**
 * ==============================================
 * RUTAS PARA TIPOS DE RECURSO
 * ==============================================
 * Todas las rutas tienen el prefijo: /api/resource-types
 * (El prefijo se define en app.js o index.js principal)
 */

/**
 * POST / - Crear nuevo tipo de recurso
 * Requiere:
 *  - Autenticación (JWT válido)
 *  - Rol de admin o coordinador
 * Controlador: createResourceType
 */
router.post('/', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador'])], 
  resourceTypeController.createResourceType
);

/**
 * GET / - Obtener todos los tipos de recurso
 * Requiere:
 *  - Autenticación (JWT válido)
 * Acceso: Todos los roles
 * Controlador: getAllResourceTypes
 */
router.get('/', 
  authJwt.verifyToken, 
  resourceTypeController.getAllResourceTypes
);

/**
 * GET /active - Obtener tipos de recurso activos
 * Requiere:
 *  - Autenticación (JWT válido)
 * Acceso: Todos los roles
 * Controlador: getActiveResourceTypes
 */
router.get('/active', 
  authJwt.verifyToken, 
  resourceTypeController.getActiveResourceTypes
);

/**
 * GET /:id - Obtener un tipo de recurso específico
 * Requiere:
 *  - Autenticación (JWT válido)
 * Acceso: Todos los roles
 * Controlador: getResourceTypeById
 */
router.get('/:id', 
  authJwt.verifyToken, 
  resourceTypeController.getResourceTypeById
);

/**
 * PUT /:id - Actualizar tipo de recurso
 * Requiere:
 *  - Autenticación (JWT válido)
 *  - Rol de admin o coordinador
 * Controlador: updateResourceType
 */
router.put('/:id', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador'])], 
  resourceTypeController.updateResourceType
);

/**
 * DELETE /:id - Eliminar tipo de recurso
 * Requiere:
 *  - Autenticación (JWT válido)
 *  - Rol de admin exclusivamente
 * Controlador: deleteResourceType
 */
router.delete('/:id', 
  [authJwt.verifyToken, role.isAdmin], 
  resourceTypeController.deleteResourceType
);

// Exporta el enrutador para su uso en la aplicación principal
module.exports = router;