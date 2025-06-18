const express = require('express');
const router = express.Router();
const StaffController = require('../controllers/StaffController');
const { checkAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Gestión del personal de eventos
 */

// Obtener todo el personal
router.get('/', checkAdmin, StaffController.getAllStaff);

// Crear nuevo personal
router.post('/', checkAdmin, StaffController.createStaff);

// Obtener personal por ID
router.get('/:id', checkAdmin, StaffController.getStaffById);

// Actualizar datos del personal
router.put('/:id', checkAdmin, StaffController.updateStaff);

// Cambiar estado (activo/inactivo) o disponibilidad
router.patch('/:id/status', checkAdmin, StaffController.changeStaffStatus);

// Obtener personal por tipo (filtrado)
router.get('/type/:tipoId', checkAdmin, StaffController.getStaffByType);

module.exports = router;