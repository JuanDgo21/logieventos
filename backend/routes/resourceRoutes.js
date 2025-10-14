const express = require('express'); // Importa Express para crear rutas
const router = express.Router(); // Crea un enrutador de Express
const resourceController = require('../controllers/resourceControllers'); // Importa controladores de recursos
const { authJwt, role } = require('../middlewares'); // Importa middlewares de autenticación y roles

/**
 * ==============================================
 * RUTAS PARA RECURSOS
 * ==============================================
 * Base path: /api/resources
 * Todas las rutas requieren autenticación JWT
 */

/**
 * RUTAS PÚBLICAS (solo requieren autenticación)
 * ----------------------------------------------
 * Accesibles para todos los usuarios autenticados
 * pero con restricciones de datos según rol
 */

// GET / - Obtener todos los recursos (con paginación)
router.get('/', 
  authJwt.verifyToken, // Middleware: Verifica token JWT
  resourceController.getAllResources // Controlador: Obtiene recursos paginados
);

// GET /search - Buscar recursos por nombre/descripción
router.get('/search', 
  authJwt.verifyToken, // Middleware: Verifica token JWT
  resourceController.searchResources // Controlador: Búsqueda de recursos
);

// GET /:id - Obtener un recurso específico por ID
router.get('/:id', 
  authJwt.verifyToken, // Middleware: Verifica token JWT
  resourceController.getResourceById // Controlador: Obtiene un recurso
);

/**
 * RUTAS PROTEGIDAS (requieren autenticación y roles específicos)
 * -------------------------------------------------------------
 * Accesibles solo para ciertos roles definidos
 */

// POST / - Crear un nuevo recurso
router.post('/', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Solo admin y coordinador
  ], 
  resourceController.createResource // Controlador: Crea nuevo recurso
);

// PUT /:id - Actualizar un recurso existente
router.put('/:id', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Solo admin y coordinador
  ], 
  resourceController.updateResource // Controlador: Actualiza recurso
);

// DELETE /:id - Eliminar un recurso
router.delete('/:id', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.isAdmin // Middleware: Solo admin
  ], 
  resourceController.deleteResource // Controlador: Elimina recurso
);

// Exporta el enrutador para su uso en la aplicación principal
module.exports = router;