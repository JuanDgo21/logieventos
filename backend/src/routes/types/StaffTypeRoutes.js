const express = require('express');
const router = express.Router();
const StaffTypeController = require('../../controllers/types/StaffTypeController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

// Ruta GET / - Obtener todos los tipos de personal
router.get(
  '/',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']), // Solo estos roles
  StaffTypeController.getAll
);

// Ruta GET /:id - Obtener un tipo específico
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  StaffTypeController.getById
);

// Ruta POST / - Crear nuevo tipo (solo admin)
router.post(
  '/',
  authenticateJWT,
  checkRole(['admin']), // Solo admin puede crear
  StaffTypeController.create
);

// Ruta GET /:id/staff - Obtener staff por tipo
router.get(
  '/:id/staff',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  StaffTypeController.getStaffByType
);

// Ruta PUT /:id - Actualizar tipo
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['admin', 'coordinador']), // admin y Coord pueden actualizar
  StaffTypeController.update
);

// Ruta DELETE /:id - Eliminar tipo (solo admin)
router.delete(
  '/:id',
  authenticateJWT,
  checkRole(['admin']), // Solo admin puede eliminar
  StaffTypeController.delete
);

module.exports = router;