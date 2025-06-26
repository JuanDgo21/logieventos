const express = require('express');
const router = express.Router();
const eventTypeController = require('../../controllers/types/EventTypeController');
const { verifyToken } = require('../../middlewares/authJwt'); // Importación directa del middleware
const { checkRole } = require('../../middlewares/role'); // Importación del middleware de roles

// Rutas principales
router.post('/', 
  verifyToken, 
  checkRole(['admin', 'lider']), 
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
  checkRole(['admin', 'lider']), 
  eventTypeController.updateEventType
);

// Ruta para activar
router.patch('/:id/activate',
  verifyToken,
  checkRole(['admin']),
  eventTypeController.activateEventType
);

// Ruta para desactivar (soft delete)
router.patch('/:id/deactivate', 
  verifyToken, 
  checkRole(['admin']), 
  eventTypeController.deactivateEventType
);

// Ruta especial para clonar
// router.post('/:id/clone', 
//   verifyToken, 
//   checkRole(['admin', 'lider']), 
//   eventTypeController.cloneEventType
// );

module.exports = router;