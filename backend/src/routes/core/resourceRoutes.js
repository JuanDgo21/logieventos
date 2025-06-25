const express = require('express');
const router = express.Router();
const resourceController = require('./../../controllers/core/resourceController'); // Asegúrate de que la ruta sea correcta
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Rutas principales
router.get('/', verifyToken, checkRole(['admin', 'coordinador', 'lider']), resourceController.getAllResources);
router.get('/available', verifyToken, checkRole(['admin', 'coordinador', 'lider']), resourceController.getAvailableResources);
router.get('/:id', verifyToken, checkRole(['admin', 'coordinador', 'lider']), resourceController.getResourceById);
router.post('/', verifyToken, checkRole(['admin', 'coordinador']), resourceController.createResource);
router.put('/:id', verifyToken, checkRole(['admin', 'coordinador']), resourceController.updateResource);
router.delete('/:id', verifyToken, checkRole(['admin']), resourceController.deleteResource);

// Rutas adicionales (opcionales)
// router.post('/:id/assign', verifyToken, checkRole(['admin', 'coordinador']), resourceController.assignToEvent);
// router.post('/:id/release', verifyToken, checkRole(['admin', 'coordinador']), resourceController.releaseFromEvent);
// router.get('/type/:typeId', verifyToken, checkRole(['admin', 'coordinador', 'lider']), resourceController.getResourcesByType);

module.exports = router;