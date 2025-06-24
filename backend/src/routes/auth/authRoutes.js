const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/authController');
const verifyRegister = require('../../middlewares/verifyRegister');
const { verifyToken } = require('../../middlewares/authJwt'); // Importación directa del middleware
const { checkRole } = require('../../middlewares/role'); // Importación del middleware de roles

// Middleware de diagnóstico (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
    router.use((req, res, next) => {
        console.log('\n[AuthRoutes] Petición recibida:', {
            method: req.method,
            path: req.path,
            headers: {
                authorization: req.headers.authorization ? '***' : 'NO', 
                'x-access-token': req.headers['x-access-token'] ? '***' : 'NO'
            }
        });
        next();
    });
}

// Rutas públicas
router.post('/login', authController.login);

// Ruta de registro (con validaciones)
router.post('/register',
    (req, res, next) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[AuthRoutes] Verificando registro...');
        }
        next();
    },
    verifyRegister.checkDuplicateUsernameOrEmail,
    verifyRegister.checkRolesExisted,
    authController.register
);

// Ruta protegida de ejemplo (usando verifyToken y checkRole)
router.get('/protected-route', 
    verifyToken, 
    checkRole('admin', 'coordinador'), 
    (req, res) => {
        res.json({ message: 'Ruta protegida accesible' });
    }
);

// Verificación de rutas (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
    console.log('[AuthRoutes] Rutas configuradas:');
    router.stack.forEach(layer => {
        if (layer.route) {
            console.log(`- ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
        }
    });
}

module.exports = router;