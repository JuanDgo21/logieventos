const express = require('express');
const router = express.Router();
const SupplierTypeController = require('../../controllers/types/SupplierTypeController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Middleware de permisos
router.use(verifyToken, SupplierTypeController.checkPermissions);

// Obtener categorías principales
router.get(
  '/main-categories',
  checkRole('admin', 'coordinador', 'lider'),
  SupplierTypeController.getMainCategories
);

// Obtener subcategorías
router.get(
  '/:mainCategory/subcategories',
  checkRole('admin', 'coordinador', 'lider'),
  SupplierTypeController.getSubcategories
);

// Obtener todos los tipos
router.get(
  '/',
  checkRole('admin', 'coordinador', 'lider'),
  SupplierTypeController.getAll
);

// Crear nuevo tipo
router.post(
  '/',
  checkRole('admin', 'coordinador'),
  SupplierTypeController.create
);

// Obtener tipo por ID
router.get(
  '/:id',
  checkRole('admin', 'coordinador', 'lider'),
  SupplierTypeController.getById
);

// Actualizar tipo
router.put(
  '/:id',
  checkRole('admin', 'coordinador'),
  SupplierTypeController.update
);

// Desactivar tipo
router.patch(
  '/:id/deactivate',
  checkRole('admin', 'coordinador'),
  SupplierTypeController.deactivate
);

// Eliminar tipo (Solo admin)
router.delete(
  '/:id',
  checkRole('admin'),
  SupplierTypeController.delete
);

// Obtener proveedores por tipo
router.get(
  '/:id/suppliers',
  checkRole('admin', 'coordinador', 'lider'),
  SupplierTypeController.getSuppliersByType
);

module.exports = router;