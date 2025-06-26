const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/core/EventController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Rutas principales CRUD
router.post('/', 
  verifyToken, 
  checkRole(['admin', 'coordinador']), 
  eventController.createEvent
);

router.get('/', 
  verifyToken, 
  eventController.getAllEvents
);

router.get('/:id', 
  verifyToken, 
  eventController.getEventById
);

router.put('/:id', 
  verifyToken, 
  checkRole(['admin', 'coordinador']), 
  eventController.updateEvent
);

// Ruta para cambio de estado
router.patch('/:id/status', 
  verifyToken, 
  checkRole(['admin', 'coordinador', 'lider']), 
  eventController.changeEventStatus
);

// Ruta para eliminación (solo admin)
router.delete('/:id', 
  verifyToken, 
  checkRole(['admin']), 
  eventController.deleteEvent
);

// Rutas adicionales para recursos
// router.post('/:eventId/resources', 
//   verifyToken, 
//   checkRole(['admin', 'coordinador']),
//   eventController.addResourceToEvent
// );

// router.put('/:eventId/resources/:resourceId', 
//   verifyToken, 
//   checkRole(['admin', 'coordinador']),
//   eventController.updateEventResource
// );

module.exports = router;