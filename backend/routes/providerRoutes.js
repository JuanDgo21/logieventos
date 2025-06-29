const express = require('express'); // Importa Express para crear rutas
const router = express.Router(); // Crea un enrutador de Express
const providerController = require('../controllers/providerControllers'); // Importa los controladores de proveedores
const { authJwt, role } = require('../middlewares'); // Importa middlewares de autenticación y roles

/**
 * ==============================================
 * RUTAS PARA PROVEEDORES
 * ==============================================
 * Base path: /api/providers
 * Todas las rutas requieren autenticación JWT
 */

/**
 * RUTAS PÚBLICAS (solo requieren autenticación)
 * ----------------------------------------------
 * Accesibles para todos los usuarios autenticados
 * pero con restricciones de datos según rol
 */

// GET / - Obtener todos los proveedores
router.get('/', 
  [authJwt.verifyToken], // Middleware: Verifica token JWT
  providerController.getAllProviders // Controlador: Obtiene todos los proveedores
);

// GET /:id - Obtener un proveedor específico
router.get('/:id', 
  [authJwt.verifyToken], // Middleware: Verifica token JWT
  providerController.getProviderById // Controlador: Obtiene un proveedor por ID
);

/**
 * RUTAS PROTEGIDAS (requieren autenticación y roles específicos)
 * -------------------------------------------------------------
 * Accesibles solo para ciertos roles definidos
 */

// POST / - Crear un nuevo proveedor
router.post('/', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Solo admin y coordinador
  ], 
  providerController.createProvider // Controlador: Crea nuevo proveedor
);

// PUT /:id - Actualizar un proveedor existente
router.put('/:id', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Solo admin y coordinador
  ], 
  providerController.updateProvider // Controlador: Actualiza proveedor
);

// DELETE /:id - Eliminar un proveedor
router.delete('/:id', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.isAdmin // Middleware: Solo admin
  ], 
  providerController.deleteProvider // Controlador: Elimina proveedor
);

// Exporta el enrutador para usarlo en la aplicación principal
module.exports = router;