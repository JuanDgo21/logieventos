const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/core/eventController');
const { verifyToken, checkRole } = require('../middlewares/authJwt');

router.post('/', verifyToken, checkRole(['coordinador', 'admin']), eventController.createEvent);
router.get('/', verifyToken, eventController.getAllEvents);
router.get('/:id', verifyToken, eventController.getEventById);
router.put('/:id', verifyToken, checkRole(['coordinador', 'admin']), eventController.updateEvent);
router.delete('/:id', verifyToken, checkRole(['admin']), eventController.deleteEvent);

// Ruta especial para asignación
router.post('/:eventId/resources/:resourceIndex/providers/:providerId', 
  verifyToken, 
  checkRole(['coordinador']), 
  eventController.assignProviderToResource
);

module.exports = router;