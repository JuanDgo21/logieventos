const express = require('express');
const router = express.Router();
const staffController = require('../../controllers/core/staffController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación
router.use(authenticate);

// Obtener todo el personal (Admin)
router.get('/', authorize(['admin']), staffController.getAllStaff);

// Obtener miembro específico del personal
router.get('/:id', authorize(['admin', 'coordinador', 'lider']), staffController.getStaffById);

// Crear nuevo miembro del personal (Admin y coordinador)
router.post('/', authorize(['admin', 'coordinador']), staffController.createStaff);

// Actualizar miembro del personal (Admin y coordinador)
router.put('/:id', authorize(['admin', 'coordinador']), staffController.updateStaff);

// Eliminar miembro del personal (Solo Admin)
router.delete('/:id', authorize(['admin']), staffController.deleteStaff);

// Obtener personal por tipo (Admin y coordinador)
router.get('/type/:typeId', authorize(['admin', 'coordinador']), staffController.getStaffByType);

module.exports = router;