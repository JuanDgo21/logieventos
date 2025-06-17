const express = require('express');
const router = express.Router();
const staffTypeController = require('../../controllers/types/staffTypeController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación
router.use(authenticate);

// Obtener todos los tipos de personal (Admin y coordinador)
router.get('/', authorize(['admin', 'coordinador']), staffTypeController.getAllStaffTypes);

// Obtener tipo específico (Admin y coordinador)
router.get('/:id', authorize(['admin', 'coordinador']), staffTypeController.getStaffTypeById);

// Crear nuevo tipo (Solo Admin)
router.post('/', authorize(['admin']), staffTypeController.createStaffType);

// Actualizar tipo (Solo Admin)
router.put('/:id', authorize(['admin']), staffTypeController.updateStaffType);

// Eliminar tipo (Solo Admin)
router.delete('/:id', authorize(['admin']), staffTypeController.deleteStaffType);

// Obtener personal por tipo (Admin y coordinador)
router.get('/:id/staff', authorize(['admin', 'coordinador']), staffTypeController.getStaffByType);

module.exports = router;