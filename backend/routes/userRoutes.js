const express = require('express'); // Importa Express para manejar rutas
const router = express.Router();    // Crea un enrutador de Express
const userController = require('../controllers/userControllers'); // Importa controladores de usuario
const { authJwt, role } = require('../middlewares'); // Importa middlewares de autenticación y roles

// ==================================================
//  RUTAS PÚBLICAS (No requieren autenticación)
// ==================================================
// (En este caso, no hay rutas públicas en este ejemplo)

// ==================================================
//  RUTAS PROTEGIDAS (Requieren autenticación)
// ==================================================

// 1. Crear un nuevo usuario (Solo admin y coordinadores)
router.post('/', 
  [
    authJwt.verifyToken,           // Middleware: Verifica el token JWT
    role.checkRole(['admin', 'coordinador']) // Middleware: Solo permite estos roles
  ], 
  userController.createUser         // Controlador: Lógica para crear usuario
);

// 2. Obtener todos los usuarios (Solo admin)
router.get('/', 
  [
    authJwt.verifyToken,           // Verifica token
    role.checkRole(['admin', 'coordinador'])                 // Middleware: Solo admin puede acceder
  ], 
  userController.getAllUsers       // Controlador: Obtiene todos los usuarios
);

// 3. Obtener un usuario por ID (Requiere autenticación)
router.get('/:id', 
  [
    authJwt.verifyToken            // Solo requiere token válido
  ], 
  userController.getUserById       // Controlador: Obtiene usuario específico
);

// 4. Actualizar usuario (Requiere autenticación)
router.put('/:id', 
  [
    authJwt.verifyToken            // Requiere token válido
  ], 
  userController.updateUser        // Controlador: Actualiza usuario
);

// 5. Eliminar usuario (Solo admin)
router.delete('/:id', 
  [
    authJwt.verifyToken,           // Verifica token
    role.isAdmin                   // Solo admin puede eliminar
  ], 
  userController.deleteUser        // Controlador: Elimina usuario
);

// Exporta el enrutador para usarlo en app.js
module.exports = router;