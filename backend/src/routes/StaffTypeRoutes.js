const express = require('express');
const router = express.Router();
const StaffTypeController = require('../controllers/StaffTypeController');
const { checkAdmin } = require('../middleware/authMiddleware');

// Obtener todos los tipos de personal
router.get('/', checkAdmin, StaffTypeController.getStaffTypes);

// Crear un nuevo tipo de personal
router.post('/', checkAdmin, StaffTypeController.createStaffType);

// Obtener un tipo de personal por ID
router.get('/:id', checkAdmin, StaffTypeController.getStaffTypeById);

// Actualizar un tipo de personal
router.put('/:id', checkAdmin, StaffTypeController.updateStaffType);

// Eliminar un tipo de personal
router.delete('/:id', checkAdmin, StaffTypeController.deleteStaffType);

// **Ruta adicional para gestión de roles**
router.post('/:id/roles', checkAdmin, StaffTypeController.addRoleToStaffType);

module.exports = router;