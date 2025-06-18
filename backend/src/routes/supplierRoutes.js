const express = require('express');
const router = express.Router();
const supplierController = require('../../controllers/core/supplierController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Obtener todos los proveedores
router.get('/', authorize(['admin', 'coordinador', 'auxiliar']), supplierController.getAllSuppliers);

// Obtener proveedor específico
router.get('/:id', authorize(['admin', 'coordinador', 'auxiliar']), supplierController.getSupplierById);

// Crear nuevo proveedor (Admin y coordinador)
router.post('/', authorize(['admin', 'coordinador']), supplierController.createSupplier);

// Actualizar proveedor (Admin y coordinador)
router.put('/:id', authorize(['admin', 'coordinador']), supplierController.updateSupplier);

// Eliminar proveedor (Solo Admin)
router.delete('/:id', authorize(['admin']), supplierController.deleteSupplier);

// Obtener proveedores por tipo
router.get('/type/:typeId', authorize(['admin', 'coordinador', 'auxiliar']), supplierController.getSuppliersByType);

module.exports = router;