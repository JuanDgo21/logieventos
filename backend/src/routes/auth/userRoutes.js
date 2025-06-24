const express = require('express');
const router = express.Router();
const userController = require('../../controllers/auth/userController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Middleware de diagnóstico simplificado
router.use((req, res, next) => {
    console.log(`[USER ROUTE] ${req.method} ${req.originalUrl}`);
    next();
});

// Rutas de usuarios (asegúrate que los nombres coincidan exactamente)
router.get('/', verifyToken, checkRole('admin', 'coordinador', 'lider'), userController.getAllUsers);
router.post('/', verifyToken, checkRole('admin'), userController.createUser);
router.get('/:id', verifyToken, checkRole('admin', 'coordinador', 'lider'), userController.getUserById);
router.put('/:id', verifyToken, checkRole('admin', 'coordinador'), userController.updateUser);
router.delete('/:id', verifyToken, checkRole('admin'), userController.deleteUser);

module.exports = router;