const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/authController');
const { verify } = require('jsonwebtoken');
const verifyRegister = require('../../middlewares/verifyRegister');

// // Importación de verificación
let verifyToken;
try {
    const authJwt = require('');
    verifyToken = authJwt.verifyToken;
    console.log('[AuthRoutes] verifyToken importado correctamente', typeof verifyToken);

} catch(error) {
    console.log('[AuthRoutes] ERROR al importar verifyToken', error);
    throw error;
}

// Middleware de diagnostico
router.use((req, res, next)=> {
    console.log('\n[AuthRoutes] Peticion recibida: ', {
        method: req.method,
        path: req.path,
        Headers:{
            authorization: req.headers.authorization ?  '***' : 'NO', 
            'x-access-token': req.headers
            ['x-access-token']? '***' : 'NO'
        }
    });
    next();
});

// Rutas de login (sin proteccion)
router.post('/login', authController.login);

// Ruta de registro
router.post('/register',
    (req, res, next) => {
        console.log('[AuthRoutes] Middlewares de verificacion de registro');
        next();
    },
    verifyRegister.checkDuplicateUsernameOrEmail,
    verifyRegister.checkRolesExisted,
    authController.register
);

// Verificacion final de rutas
console.log('[AuthRoutes] Rutas configuradas:', router.stack.map(Layer => {
    return {
        path: Layer.route ?.path,
        method: Layer.router?.method
    }
}));

module.exports = router;