const express = require('express');
const router = express.Router();
const resourceTypeController = require('../../controllers/core/resourceTypeController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Obtener todos los tipos de recursos
router.get('/', authorize(['admin', 'coordinador', 'auxiliar']), resourceTypeController.getAllResourceTypes);

// Obtener tipo de recurso específico
router.get('/:id', authorize(['admin', 'coordinador', 'auxiliar']), resourceTypeController.getResourceTypeById);

// Crear nuevo tipo de recurso (Solo Admin)
router.post('/', authorize(['admin']), resourceTypeController.createResourceType);

// Actualizar tipo de recurso (Solo Admin)
router.put('/:id', authorize(['admin']), resourceTypeController.updateResourceType);

// Eliminar tipo de recurso (Solo Admin)
router.delete('/:id', authorize(['admin']), resourceTypeController.deleteResourceType);

// Obtener recursos por tipo
router.get('/:id/resources', authorize(['admin', 'coordinador', 'auxiliar']), resourceTypeController.getResourcesByType);

module.exports = router;