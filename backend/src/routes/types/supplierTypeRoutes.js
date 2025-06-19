const express = require('express');
const router = express.Router();
const SupplierTypeController = require('../../controllers/types/SupplierTypeController');
const { 
    authenticateJWT, 
    checkRole 
} = require('../../middlewares/auth');

console.log('Inicializando rutas de SupplierType...');

// ----------------------------------------
// Ruta: Obtener todos los tipos de proveedores
// Permisos: Líder, Coordinador, Admin
// ----------------------------------------
router.get(
    '/',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador', 'Líder']),
    (req, res, next) => {
        console.log(`Solicitud GET /supplier-types recibida - Usuario: ${req.user._id} Rol: ${req.user.role}`);
        next();
    },
    SupplierTypeController.getAll
);

// ----------------------------------------
// Ruta: Crear nuevo tipo de proveedor
// Permisos: Solo Admin
// ----------------------------------------
router.post(
    '/',
    authenticateJWT,
    checkRole(['Admin']),
    (req, res, next) => {
        console.log(`Solicitud POST /supplier-types recibida - Usuario: ${req.user._id}`);
        console.log('Datos recibidos:', req.body);
        next();
    },
    SupplierTypeController.create
);

// ----------------------------------------
// Ruta: Obtener un tipo específico
// Permisos: Líder, Coordinador, Admin
// ----------------------------------------
router.get(
    '/:id',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador', 'Líder']),
    (req, res, next) => {
        console.log(`Solicitud GET /supplier-types/${req.params.id} recibida - Usuario: ${req.user._id}`);
        next();
    },
    SupplierTypeController.getById
);

// ----------------------------------------
// Ruta: Obtener proveedores por tipo
// Permisos: Líder (solo activos), Coordinador, Admin
// ----------------------------------------
router.get(
    '/:id/suppliers',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador', 'Líder']),
    (req, res, next) => {
        console.log(`Solicitud GET /supplier-types/${req.params.id}/suppliers recibida - Usuario: ${req.user._id}`);
        next();
    },
    SupplierTypeController.getSuppliersByType
);

// ----------------------------------------
// Ruta: Actualizar tipo de proveedor
// Permisos: Solo Admin
// ----------------------------------------
router.put(
    '/:id',
    authenticateJWT,
    checkRole(['Admin']),
    (req, res, next) => {
        console.log(`Solicitud PUT /supplier-types/${req.params.id} recibida - Usuario: ${req.user._id}`);
        console.log('Datos de actualización:', req.body);
        next();
    },
    SupplierTypeController.update
);

// ----------------------------------------
// Ruta: Desactivar tipo de proveedor (eliminación lógica)
// Permisos: Solo Admin
// ----------------------------------------
router.patch(
    '/:id/deactivate',
    authenticateJWT,
    checkRole(['Admin']),
    (req, res, next) => {
        console.log(`Solicitud PATCH /supplier-types/${req.params.id}/deactivate recibida - Usuario: ${req.user._id}`);
        next();
    },
    SupplierTypeController.deactivate
);

console.log('Rutas de SupplierType configuradas correctamente');
module.exports = router;