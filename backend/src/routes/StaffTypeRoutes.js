const express = require('express');
const router = express.Router();
const StaffTypeController = require('../controllers/types/StaffTypeController');
const { 
    authenticateJWT, 
    checkRole 
} = require('../middlewares/auth');

console.log('Inicializando rutas de StaffType...');

// ----------------------------------------
// Ruta: Obtener todos los tipos de personal
// Permisos: Líder, Coordinador, Admin
// ----------------------------------------
router.get(
    '/',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador', 'Líder']),
    (req, res, next) => {
        console.log(`Solicitud GET /staff-types recibida - Usuario: ${req.user._id} Rol: ${req.user.role}`);
        next();
    },
    StaffTypeController.getAll
);

// ----------------------------------------
// Ruta: Crear nuevo tipo de personal
// Permisos: Solo Admin
// ----------------------------------------
router.post(
    '/',
    authenticateJWT,
    checkRole(['Admin']),
    (req, res, next) => {
        console.log(`Solicitud POST /staff-types recibida - Usuario: ${req.user._id}`);
        console.log('Datos recibidos:', req.body);
        next();
    },
    StaffTypeController.create
);

// ----------------------------------------
// Ruta: Obtener personal por tipo
// Permisos: Líder, Coordinador, Admin
// ----------------------------------------
router.get(
    '/:id/staff',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador', 'Líder']),
    (req, res, next) => {
        console.log(`Solicitud GET /staff-types/${req.params.id}/staff recibida - Usuario: ${req.user._id}`);
        next();
    },
    StaffTypeController.getStaffByType
);

// ----------------------------------------
// Ruta: Actualizar tipo de personal
// Permisos: Admin (completo), Coordinador (solo descripción)
// ----------------------------------------
router.put(
    '/:id',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador']),
    (req, res, next) => {
        console.log(`Solicitud PUT /staff-types/${req.params.id} recibida - Usuario: ${req.user._id}`);
        console.log('Datos de actualización:', req.body);
        next();
    },
    StaffTypeController.update
);

// ----------------------------------------
// Ruta: Eliminación lógica de tipo
// Permisos: Solo Admin
// ----------------------------------------
router.delete(
    '/:id',
    authenticateJWT,
    checkRole(['Admin']),
    (req, res, next) => {
        console.log(`Solicitud DELETE /staff-types/${req.params.id} recibida - Usuario: ${req.user._id}`);
        next();
    },
    StaffTypeController.delete
);

console.log('Rutas de StaffType configuradas correctamente');
module.exports = router;