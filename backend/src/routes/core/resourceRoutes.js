const express = require('express');
const router = express.Router();
const resourceController = require('../../controllers/core/resourceController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Middleware de autenticación
router.use(verifyToken);

// Obtener todos los recursos
router.get('/', checkRole(['admin', 'coordinador', 'lider']), resourceController.getAllResources);

// Obtener recursos disponibles
router.get('/available', checkRole(['admin', 'coordinador', 'lider']), resourceController.getAvailableResources);

// Obtener recurso específico
router.get('/:id', checkRole(['admin', 'coordinador', 'lider']), resourceController.getResourceById);

// Crear nuevo recurso (Admin y coordinador)
router.post('/', checkRole(['admin', 'coordinador']), resourceController.createResource);

// Actualizar recurso (Admin y coordinador)
router.put('/:id', checkRole(['admin', 'coordinador']), resourceController.updateResource);

// Eliminar recurso (Solo Admin)
router.delete('/:id', checkRole(['admin']), resourceController.deleteResource);

// Asignar recurso a evento (Admin y coordinador)
router.post('/:id/assign', checkRole(['admin', 'coordinador']), resourceController.assignToEvent);

// Liberar recurso de evento (Admin y coordinador)
router.post('/:id/release', checkRole(['admin', 'coordinador']), resourceController.releaseFromEvent);

// Obtener recursos por tipo
router.get('/type/:typeId', checkRole(['admin', 'coordinador', 'lider']), resourceController.getResourcesByType);

// Cambiar estado de mantenimiento (Admin y coordinador)
router.post('/:id/maintenance', checkRole(['admin', 'coordinador']), resourceController.updateMaintenanceStatus);

module.exports = router;