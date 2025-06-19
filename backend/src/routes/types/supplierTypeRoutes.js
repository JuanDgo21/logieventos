const express = require('express');
const router = express.Router();
const SupplierTypeController = require('../../controllers/types/SupplierTypeController');
const { checkRole } = require('../../middlewares/role');

// Middlewares de roles
const adminOnly = checkRole(['admin']);
const editorOrAdmin = checkRole(['editor', 'admin']);

// CRUD para tipos de proveedor
router.post('/', adminOnly, SupplierTypeController.create);          // Crear tipo
router.get('/', SupplierTypeController.getAll);                     // Obtener todos
router.get('/:id', SupplierTypeController.getById);                 // Obtener por ID
router.put('/:id', editorOrAdmin, SupplierTypeController.update);   // Actualizar
router.delete('/:id', adminOnly, SupplierTypeController.delete);    // Eliminar

// Relaciones
router.get('/:id/suppliers', SupplierTypeController.getSuppliersByType); // Proveedores por tipo

module.exports = router;