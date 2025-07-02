const express = require('express'); // Importa Express para crear rutas
const router = express.Router(); // Crea un enrutador de Express
const providerTypeController = require('../controllers/providerTypeControllers'); // Importa controladores
const { authJwt, role } = require('../middlewares'); // Importa middlewares de autenticación y roles

/**
 * ==============================================
 * RUTAS PARA TIPOS DE PROVEEDOR
 * ==============================================
 * Base path: /api/provider-types
 * Todas las rutas requieren autenticación JWT
 */

/**
 * POST / - Crear nuevo tipo de proveedor
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de administrador
 * Controlador: createProviderType
 */
router.post('/', 
  [
    authJwt.verifyToken, // Verifica token JWT
    role.checkRole(['admin', 'coordinador'])
  ], 
  providerTypeController.createProviderType // Controlador de creación
);

/**
 * GET / - Obtener todos los tipos de proveedor
 * Requiere:
 *  - Autenticación JWT válida
 * Acceso: Todos los roles (pero líderes solo ven activos)
 * Controlador: getAllProviderTypes
 */
router.get('/', 
  authJwt.verifyToken, // Verifica token JWT
  providerTypeController.getAllProviderTypes // Controlador de obtención
);

/**
 * GET /:id - Obtener tipo de proveedor por ID
 * Requiere:
 *  - Autenticación JWT válida
 * Acceso: Todos los roles (pero líderes solo pueden ver activos)
 * Controlador: getProviderTypeById
 */
router.get('/:id', 
  authJwt.verifyToken, // Verifica token JWT
  providerTypeController.getProviderTypeById // Controlador de búsqueda
);

/**
 * PUT /:id - Actualizar tipo de proveedor
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de administrador
 * Controlador: updateProviderType
 */
router.put('/:id', 
  [
    authJwt.verifyToken, // Verifica token JWT
    role.checkRole(['admin', 'coordinador'])
  ], 
  providerTypeController.updateProviderType // Controlador de actualización
);

/**
 * DELETE /:id - Eliminar tipo de proveedor
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de administrador
 * Controlador: deleteProviderType
 */
router.delete('/:id', 
  [
    authJwt.verifyToken, // Verifica token JWT
    role.isAdmin // Valida que el usuario sea admin
  ], 
  providerTypeController.deleteProviderType // Controlador de eliminación
);

// Exporta el enrutador para usarlo en la aplicación principal
module.exports = router;