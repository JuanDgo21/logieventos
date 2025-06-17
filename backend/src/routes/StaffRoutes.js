const express = require('express');
const router = express.Router();
const staffController = require('../../controllers/core/staffController');
const { authenticate, authorize } = require('../../config/auth');

// Rutas públicas (si es necesario)
// router.get('/', staffController.somePublicMethod);

// Rutas protegidas por autenticación
router.use(authenticate);

// Obtener todo el personal (Solo Admin)
router.get('/', authorize(['admin']), staffController.getAllStaff);

// Obtener miembro específico del personal
router.get('/:id', authorize(['admin', 'coordinador', 'auxiliar']), staffController.getStaffById);

// Crear nuevo miembro del personal (Admin y coordinador)
router.post('/', authorize(['admin', 'coordinador']), staffController.createStaff);

// Actualizar miembro del personal (Admin y coordinador)
router.put('/:id', authorize(['admin', 'coordinador']), staffController.updateStaff);

// Eliminar miembro del personal (Solo Admin)
router.delete('/:id', authorize(['admin']), staffController.deleteStaff);

// Obtener personal por tipo
router.get('/type/:typeId', authorize(['admin', 'coordinador']), staffController.getStaffByType);

module.exports = router;