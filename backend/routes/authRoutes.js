// Importación de Express para crear el enrutador
const express = require('express');
const router = express.Router();

// Importación del controlador de autenticación y middlewares de validación
const authController = require('../controllers/authControllers');
const { verifySignup } = require('../middlewares');

/**
 * Ruta para registro de nuevos usuarios
 * 
 * Se aplican dos middlewares antes de llegar al controlador:
 * 1. Verificación de username/email duplicados
 * 2. Validación de roles existentes
 * 
 * PATH: POST /api/auth/signup
 */
router.post('/register', 
  [
    verifySignup.checkDuplicateUsernameOrEmail, // Middleware: Evita usuarios duplicados
    verifySignup.checkRolesExisted              // Middleware: Valida que el rol exista
  ], 
  authController.register                         // Controlador que maneja el registro
);

/**
 * Ruta para inicio de sesión de usuarios
 * 
 * PATH: POST /api/auth/signin
 * 
 * No requiere middlewares previos, el controlador valida las credenciales
 */
router.post('/login', authController.login);  // Controlador de autenticación directo

// Exportar el router configurado con las rutas
module.exports = router;