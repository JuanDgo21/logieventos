const express = require('express');
const router = express.Router();
const resourceController = require('../../controllers/core/resourceController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Obtener todos los recursos
router.get('/', authorize(['admin', 'coordinador', 'auxiliar']), resourceController.getAllResources);

// Obtener recursos disponibles
router.get('/available', authorize(['admin', 'coordinador', 'auxiliar']), resourceController.getAvailableResources);

// Obtener recurso específico
router.get('/:id', authorize(['admin', 'coordinador', 'auxiliar']), resourceController.getResourceById);

// Crear nuevo recurso (Admin y coordinador)
router.post('/', authorize(['admin', 'coordinador']), resourceController.createResource);

// Actualizar recurso (Admin y coordinador)
router.put('/:id', authorize(['admin', 'coordinador']), resourceController.updateResource);

// Eliminar recurso (Solo Admin)
router.delete('/:id', authorize(['admin']), resourceController.deleteResource);

// Asignar recurso a evento (Coordinador y admin)
router.post('/:id/assign', authorize(['admin', 'coordinador']), resourceController.assignToEvent);

// Liberar recurso de evento (Coordinador y admin)
router.post('/:id/release', authorize(['admin', 'coordinador']), resourceController.releaseFromEvent);

// Obtener recursos por tipo
router.get('/type/:typeId', authorize(['admin', 'coordinador', 'auxiliar']), resourceController.getResourcesByType);

module.exports = router;