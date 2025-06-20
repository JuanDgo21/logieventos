const express = require('express');
const router = express.Router();
const resourceTypeController = require('../../controllers/types/resourceTypeController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Middleware de autenticación
router.use(verifyToken);

// Obtener todos los tipos de recursos
router.get('/', checkRole(['admin', 'coordinador', 'lider']), resourceTypeController.getAllResourceTypes);

// Obtener tipo de recurso específico
router.get('/:id', checkRole(['admin', 'coordinador', 'lider']), resourceTypeController.getResourceTypeById);

// Crear nuevo tipo de recurso (Solo Admin)
router.post('/', checkRole(['admin']), resourceTypeController.createResourceType);

// Actualizar tipo de recurso (Solo Admin)
router.put('/:id', checkRole(['admin']), resourceTypeController.updateResourceType);

// Eliminar tipo de recurso (Solo Admin)
router.delete('/:id', checkRole(['admin']), resourceTypeController.deleteResourceType);

// Obtener recursos por tipo
router.get('/:id/resources', checkRole(['admin', 'coordinador', 'lider']), resourceTypeController.getResourcesByType);

module.exports = router;