const express = require('express');
const router = express.Router();
const staffTypeController = require('../../controllers/core/staffTypeController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Obtener todos los tipos de personal (Admin y coordinador)
router.get('/', authorize(['admin', 'coordinador']), staffTypeController.getAllStaffTypes);

// Obtener tipo de personal específico (Admin y coordinador)
router.get('/:id', authorize(['admin', 'coordinador']), staffTypeController.getStaffTypeById);

// Crear nuevo tipo de personal (Solo Admin)
router.post('/', authorize(['admin']), staffTypeController.createStaffType);

// Actualizar tipo de personal (Solo Admin)
router.put('/:id', authorize(['admin']), staffTypeController.updateStaffType);

// Eliminar tipo de personal (Solo Admin)
router.delete('/:id', authorize(['admin']), staffTypeController.deleteStaffType);

// Obtener personal por tipo (Admin y coordinador)
router.get('/:id/staff', authorize(['admin', 'coordinador']), staffTypeController.getStaffByType);

module.exports = router;