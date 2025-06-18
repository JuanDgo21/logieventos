const express = require('express');
const router = express.Router();
const userController = require('../../controllers/auth/userController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Middleware de diagnóstico para todas las rutas
router.use((req, res, next) => {
    console.log('\n=== DIAGNÓSTICO DE RUTA ===');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', {
        'authorization': req.headers.authorization ? '***' + req.headers.authorization.slice(-8) : null,
        'x-access-token': req.headers['x-access-token'] ? '***' + req.headers['x-access-token'].slice(-8) : null,
        'user-agent': req.headers['user-agent']
    });
    next();
});

// GET /api/users - Listar usuarios (admin y coordinador pueden ver todos, lider solo se ve a sí mismo)
router.get('/',
    verifyToken,
    checkRole('admin', 'coordinador', 'lider'),
    userController.getAllUsers
);

// POST /api/users - Crear usuario (solo admin)
router.post('/',
    verifyToken,
    checkRole('admin'),
    userController.createUser
);

// GET /api/users/:id - Obtener usuario específico (admin y coordinador pueden ver cualquiera, auxiliar solo se ve asi mismo)
router.get('/:id',
    verifyToken,
    checkRole('admin', 'coordinador', 'lider'),
    userController.getUserById
);

// PUT /api/users/:id - Actualizar usuario (admin y coordinador pueden actualizar)
router.put('/:id',
    verifyToken,
    checkRole('admin', 'coordinador'),
    userController.updateUser
);

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id',
    verifyToken,
    checkRole('admin'),
    userController.deleteUser
);

module.exports = router; // Nota: Asegúrate de que los middlewares verifyToken y checkRole estén correctamente implementados 