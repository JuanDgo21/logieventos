const express = require('express');
const router = express.Router();
const SuppliersController = require('../../controllers/core/suppliersController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

console.log('Inicializando rutas de proveedores...');

// ----------------------------------------
// Ruta: Crear nuevo proveedor
// Permisos: Admin (directo), Coordinador (pendiente)
// ----------------------------------------
router.post(
  '/',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador']),
  (req, res, next) => {
    console.log(`POST /suppliers - Usuario: ${req.user._id} Rol: ${req.user.role}`);
    console.log('Datos recibidos:', req.body);
    next();
  },
  SuppliersController.create
);

// ----------------------------------------
// Ruta: Obtener todos los proveedores
// Permisos: Todos (filtrado por rol)
// ----------------------------------------
router.get(
  '/',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  (req, res, next) => {
    console.log(`GET /suppliers - Usuario: ${req.user._id} Rol: ${req.user.role}`);
    next();
  },
  SuppliersController.getAll
);

// ----------------------------------------
// Ruta: Obtener proveedor específico
// Permisos: Todos (filtrado por rol)
// ----------------------------------------
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  (req, res, next) => {
    console.log(`GET /suppliers/${req.params.id} - Usuario: ${req.user._id}`);
    next();
  },
  SuppliersController.getById
);

// ----------------------------------------
// Ruta: Actualizar proveedor
// Permisos: Admin (completo), Coordinador (parcial)
// ----------------------------------------
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador']),
  (req, res, next) => {
    console.log(`PUT /suppliers/${req.params.id} - Usuario: ${req.user._id}`);
    console.log('Cambios solicitados:', req.body);
    next();
  },
  SuppliersController.update
);

// ----------------------------------------
// Ruta: Aprobar/Rechazar proveedor
// Permisos: Solo Admin
// ----------------------------------------
router.post(
  '/:id/approve',
  authenticateJWT,
  checkRole(['Admin']),
  (req, res, next) => {
    console.log(`POST /suppliers/${req.params.id}/approve - Usuario: ${req.user._id}`);
    console.log('Datos:', req.body);
    next();
  },
  SuppliersController.approve
);

// ----------------------------------------
// Ruta: Calificar proveedor
// Permisos: Todos (diferente impacto)
// ----------------------------------------
router.post(
  '/:id/rate',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  (req, res, next) => {
    console.log(`POST /suppliers/${req.params.id}/rate - Usuario: ${req.user._id}`);
    console.log('Calificación:', req.body);
    next();
  },
  SuppliersController.rate
);

// ----------------------------------------
// Ruta: Obtener proveedores por tipo
// Permisos: Todos (filtrado por rol)
// ----------------------------------------
router.get(
  '/type/:typeId',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  (req, res, next) => {
    console.log(`GET /suppliers/type/${req.params.typeId} - Usuario: ${req.user._id}`);
    next();
  },
  SuppliersController.getByType
);

console.log('Rutas de proveedores configuradas correctamente');
module.exports = router;