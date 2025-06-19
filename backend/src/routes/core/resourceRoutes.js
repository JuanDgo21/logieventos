const express = require('express');
const router = express.Router();
const resourceController = require('../../controllers/core/resourceController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación
router.use(authenticate);

// Obtener todos los recursos
router.get('/', authorize(['admin', 'coordinador', 'lider']), resourceController.getAllResources);

// Obtener recursos disponibles
router.get('/available', authorize(['admin', 'coordinador', 'lider']), resourceController.getAvailableResources);

// Obtener recurso específico
router.get('/:id', authorize(['admin', 'coordinador', 'lider']), resourceController.getResourceById);

// Crear nuevo recurso (Admin y coordinador)
router.post('/', authorize(['admin', 'coordinador']), resourceController.createResource);

// Actualizar recurso (Admin y coordinador)
router.put('/:id', authorize(['admin', 'coordinador']), resourceController.updateResource);

// Eliminar recurso (Solo Admin)
router.delete('/:id', authorize(['admin']), resourceController.deleteResource);

// Asignar recurso a evento (Admin y coordinador)
router.post('/:id/assign', authorize(['admin', 'coordinador']), resourceController.assignToEvent);

// Liberar recurso de evento (Admin y coordinador)
router.post('/:id/release', authorize(['admin', 'coordinador']), resourceController.releaseFromEvent);

// Obtener recursos por tipo
router.get('/type/:typeId', authorize(['admin', 'coordinador', 'lider']), resourceController.getResourcesByType);

module.exports = router;