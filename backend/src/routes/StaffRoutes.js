const express = require('express');
const router = express.Router();
const PersonalController = require('../controllers/PersonalController');
const { fullAccess, readWriteAccess, readOnlyAccess } = require('../middlewares/role');

// Obtener todo (Líder+)
router.get('/', readOnlyAccess, PersonalController.getAll);

// Crear (Admin/Coordinador)
router.post('/', readWriteAccess, PersonalController.create);

// Obtener por ID (Líder+)
router.get('/:id', readOnlyAccess, PersonalController.getById);

// Actualizar (Admin/Coordinador)
router.put('/:id', readWriteAccess, PersonalController.update);

// Cambiar estado (Solo Admin)
router.patch('/:id/status', fullAccess, PersonalController.changeStatus);

module.exports = router;