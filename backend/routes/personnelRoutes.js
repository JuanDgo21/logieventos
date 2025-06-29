const express = require('express'); // Importa Express para crear rutas
const router = express.Router(); // Crea un enrutador de Express
const personnelController = require('../controllers/personnelControllers'); // Importa controladores de personal
const { authJwt, role } = require('../middlewares'); // Importa middlewares de autenticación y roles

/**
 * ==============================================
 * RUTAS PARA GESTIÓN DE PERSONAL
 * ==============================================
 * Base path: /api/personnel
 * Todas las rutas requieren autenticación JWT
 */

/**
 * RUTAS PÚBLICAS (solo requieren autenticación)
 * ----------------------------------------------
 * Accesibles para todos los usuarios autenticados
 * pero con restricciones de datos según rol
 */

// GET / - Obtener todo el personal
router.get('/', 
  [authJwt.verifyToken], // Middleware: Verifica token JWT
  personnelController.getAllPersonnel // Controlador: Obtiene listado de personal
);

// GET /:id - Obtener un miembro de personal específico
router.get('/:id', 
  [authJwt.verifyToken], // Middleware: Verifica token JWT
  personnelController.getPersonnelById // Controlador: Obtiene detalle de personal
);

/**
 * RUTAS PROTEGIDAS (requieren autenticación y roles específicos)
 * -------------------------------------------------------------
 * Accesibles solo para ciertos roles definidos
 */

// POST / - Crear nuevo miembro de personal
router.post('/', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Solo admin y coordinador
  ], 
  personnelController.createPersonnel // Controlador: Crea nuevo personal
);

// PUT /:id - Actualizar miembro de personal
router.put('/:id', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Solo admin y coordinador
  ], 
  personnelController.updatePersonnel // Controlador: Actualiza personal
);

// DELETE /:id - Eliminar miembro de personal
router.delete('/:id', 
  [
    authJwt.verifyToken, // Middleware: Verifica token JWT
    role.isAdmin // Middleware: Solo admin
  ], 
  personnelController.deletePersonnel // Controlador: Elimina personal
);

// Exporta el enrutador para usarlo en la aplicación principal
module.exports = router;