// Importación de Express para crear el enrutador
const express = require('express');
const router = express.Router();

// Importación del controlador de autenticación y middlewares de validación
const authController = require('../controllers/authControllers');
const { verifySignup, authJwt } = require('../middlewares');

/**
 * Ruta para registro de nuevos usuarios
 * 
 * Se aplican dos middlewares antes de llegar al controlador:
 * 1. Verificación de username/email duplicados
 * 2. Validación de roles existentes
 * 
 * PATH: POST /api/auth/signup
 */
router.post('/signup', 
  [
    verifySignup.checkDuplicateUsernameOrEmail, // Middleware: Evita usuarios duplicados
    verifySignup.checkRolesExisted              // Middleware: Valida que el rol exista
  ], 
  authController.signup                         // Controlador que maneja el registro
);

/**
 * Ruta para inicio de sesión de usuarios
 * 
 * PATH: POST /api/auth/signin
 * 
 * No requiere middlewares previos, el controlador valida las credenciales
 */
router.post('/signin', authController.signin);  // Controlador de autenticación directo

// Nuevas rutas para recuperación de contraseña
router.post('/change-password', [authJwt.verifyToken], authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Exportar el router configurado con las rutas
module.exports = router;