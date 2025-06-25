const express = require('express');
const router = express.Router();
const resourceTypeController = require('../../controllers/types/resourceTypeController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Obtener todos los tipos de recursos
router.get('/', verifyToken, checkRole(['admin', 'coordinador', 'lider']), resourceTypeController.getAllResourceTypes);

// Obtener tipo de recurso específico
router.get('/:id', verifyToken, checkRole(['admin', 'coordinador', 'lider']), resourceTypeController.getResourceTypeById);

// Crear nuevo tipo de recurso (Solo Admin)
router.post('/', verifyToken, checkRole(['admin']), resourceTypeController.createResourceType);

// Actualizar tipo de recurso (Solo Admin)
router.put('/:id', verifyToken, checkRole(['admin']), resourceTypeController.updateResourceType);

// Eliminar tipo de recurso (Solo Admin)
router.delete('/:id', verifyToken, checkRole(['admin']), resourceTypeController.deleteResourceType);

module.exports = router;