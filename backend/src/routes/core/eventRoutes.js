const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/core/eventController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Rutas básicas CRUD
router.route('/')
  .post(verifyToken, checkRole(['coordinador', 'admin']), eventController.createEvent)
  .get(verifyToken, eventController.getAllEvents);

router.route('/:id')
  .get(verifyToken, eventController.getEventById)
  .put(verifyToken, checkRole(['coordinador', 'admin']), eventController.updateEvent)
  .delete(verifyToken, checkRole(['admin']), eventController.deleteEvent);

// Ruta especial para asignación de proveedores
router.post('/:eventId/resources/:resourceIndex/providers/:providerId', 
  verifyToken, 
  checkRole(['coordinador']), 
  eventController.assignProviderToResource
);

// Middleware para manejar rutas no implementadas
router.use((req, res) => {
  res.status(501).json({ 
    success: false, 
    message: 'Ruta no implementada' 
  });
});

module.exports = router;