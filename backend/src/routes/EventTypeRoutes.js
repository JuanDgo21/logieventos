const express = require('express');
const router = express.Router();
const eventTypeController = require('../controllers/eventTypeController');
const { verifyToken, checkRole } = require('../middlewares/authJwt');

// Rutas principales
router.post('/', 
  verifyToken, 
  checkRole(['admin', 'planner']), 
  eventTypeController.createEventType
);

router.get('/', 
  verifyToken, 
  eventTypeController.getAllEventTypes
);

router.get('/:id', 
  verifyToken, 
  eventTypeController.getEventTypeById
);

router.put('/:id', 
  verifyToken, 
  checkRole(['admin', 'planner']), 
  eventTypeController.updateEventType
);

// Ruta para desactivar (soft delete)
router.patch('/:id/deactivate', 
  verifyToken, 
  checkRole(['admin']), 
  eventTypeController.deactivateEventType
);

// Ruta especial para clonar
router.post('/:id/clone', 
  verifyToken, 
  checkRole(['admin', 'planner']), 
  eventTypeController.cloneEventType
);

module.exports = router;