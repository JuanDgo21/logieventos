const express = require('express');
const router = express.Router();
const StaffTypeController = require('../controllers/types/StaffTypeController');
const { fullAccess, readWriteAccess, readOnlyAccess } = require('../middlewares/role');

// Obtener todos (Líder+)
router.get('/', readOnlyAccess, StaffTypeController.getAllStaffTypes);

// Crear nuevo (Admin/Coordinador)
router.post('/', readWriteAccess, StaffTypeController.createStaffType);

// Obtener por ID (Líder+)
router.get('/:id', readOnlyAccess, StaffTypeController.getStaffTypeById);

// Actualizar (Admin/Coordinador)
router.put('/:id', readWriteAccess, StaffTypeController.updateStaffType);

// Eliminar (Solo Admin)
router.delete('/:id', fullAccess, StaffTypeController.deleteStaffType);

// Agregar rol (Admin/Coordinador)
router.post('/:id/roles', readWriteAccess, StaffTypeController.addRoleToStaffType);

module.exports = router;