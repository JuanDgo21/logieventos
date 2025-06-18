const express = require('express');
const router = express.Router();
const supplierTypeController = require('../../controllers/core/supplierTypeController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Obtener todos los tipos de proveedores
router.get('/', authorize(['admin', 'coordinador']), supplierTypeController.getAllSupplierTypes);

// Obtener tipo de proveedor específico
router.get('/:id', authorize(['admin', 'coordinador']), supplierTypeController.getSupplierTypeById);

// Crear nuevo tipo de proveedor (Solo Admin)
router.post('/', authorize(['admin']), supplierTypeController.createSupplierType);

// Actualizar tipo de proveedor (Solo Admin)
router.put('/:id', authorize(['admin']), supplierTypeController.updateSupplierType);

// Eliminar tipo de proveedor (Solo Admin)
router.delete('/:id', authorize(['admin']), supplierTypeController.deleteSupplierType);

// Obtener proveedores por tipo
router.get('/:id/suppliers', authorize(['admin', 'coordinador']), supplierTypeController.getSuppliersByType);

module.exports = router;