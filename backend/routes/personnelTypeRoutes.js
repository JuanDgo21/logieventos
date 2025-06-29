const express = require('express'); // Importa Express para crear rutas
const router = express.Router(); // Crea un enrutador de Express
const personnelTypeController = require('../controllers/personnelTypeControllers'); // Importa controladores
const { authJwt, role } = require('../middlewares'); // Importa middlewares de autenticación y roles

/**
 * ==============================================
 * RUTAS PARA TIPOS DE PERSONAL
 * ==============================================
 * Base path: /api/personnel-types
 * Todas las rutas requieren autenticación JWT
 */

/**
 * POST / - Crear nuevo tipo de personal
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de admin o coordinador
 * Controlador: createPersonnelType
 */
router.post('/', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Valida roles permitidos
  ], 
  personnelTypeController.createPersonnelType // Controlador de creación
);

/**
 * GET / - Obtener todos los tipos de personal
 * Requiere:
 *  - Autenticación JWT válida
 * Acceso: Todos los roles (líderes solo ven activos)
 * Controlador: getAllPersonnelTypes
 */
router.get('/', 
  authJwt.verifyToken, // Middleware: Verifica token JWT
  personnelTypeController.getAllPersonnelTypes // Controlador de listado
);

/**
 * GET /:id - Obtener tipo de personal específico
 * Requiere:
 *  - Autenticación JWT válida
 * Acceso: Todos los roles (líderes solo ven activos)
 * Controlador: getPersonnelTypeById
 */
router.get('/:id', 
  authJwt.verifyToken, // Middleware: Verifica token JWT
  personnelTypeController.getPersonnelTypeById // Controlador de detalle
);

/**
 * PUT /:id - Actualizar tipo de personal
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de admin o coordinador
 * Restricciones: Coordinadores no pueden cambiar estado
 * Controlador: updatePersonnelType
 */
router.put('/:id', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Valida roles permitidos
  ], 
  personnelTypeController.updatePersonnelType // Controlador de actualización
);

/**
 * DELETE /:id - Eliminar tipo de personal
 * Requiere:
 *  - Autenticación JWT válida
 *  - Rol de admin exclusivamente
 * Validación: No se puede eliminar si está en uso
 * Controlador: deletePersonnelType
 */
router.delete('/:id', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.isAdmin // Middleware: Valida que sea admin
  ], 
  personnelTypeController.deletePersonnelType // Controlador de eliminación
);

// Exporta el enrutador para usarlo en la aplicación principal
module.exports = router;