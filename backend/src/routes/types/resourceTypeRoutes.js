const express = require('express');
const router = express.Router();
const resourceTypeController = require('../../controllers/types/resourceTypeController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación
router.use(authenticate);

// Obtener todos los tipos de recursos
router.get('/', authorize(['admin', 'coordinador', 'lider']), resourceTypeController.getAllResourceTypes);

// Obtener tipo de recurso específico
router.get('/:id', authorize(['admin', 'coordinador', 'lider']), resourceTypeController.getResourceTypeById);

// Crear nuevo tipo de recurso (Solo Admin)
router.post('/', authorize(['admin']), resourceTypeController.createResourceType);

// Actualizar tipo de recurso (Solo Admin)
router.put('/:id', authorize(['admin']), resourceTypeController.updateResourceType);

// Eliminar tipo de recurso (Solo Admin)
router.delete('/:id', authorize(['admin']), resourceTypeController.deleteResourceType);

// Obtener recursos por tipo
router.get('/:id/resources', authorize(['admin', 'coordinador', 'lider']), resourceTypeController.getResourcesByType);

module.exports = router;