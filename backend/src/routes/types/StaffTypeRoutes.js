const express = require('express');
const router = express.Router();
const StaffTypeController = require('../../controllers/types/StaffTypeController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

// Ruta GET / - Obtener todos los tipos de personal
router.get(
  '/',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']), // Solo estos roles
  StaffTypeController.getAll
);

// Ruta GET /:id - Obtener un tipo específico
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  StaffTypeController.getById
);

// Ruta POST / - Crear nuevo tipo (solo Admin)
router.post(
  '/',
  authenticateJWT,
  checkRole(['Admin']), // Solo Admin puede crear
  StaffTypeController.create
);

// Ruta GET /:id/staff - Obtener staff por tipo
router.get(
  '/:id/staff',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  StaffTypeController.getStaffByType
);

// Ruta PUT /:id - Actualizar tipo
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador']), // Admin y Coord pueden actualizar
  StaffTypeController.update
);

// Ruta DELETE /:id - Eliminar tipo (solo Admin)
router.delete(
  '/:id',
  authenticateJWT,
  checkRole(['Admin']), // Solo Admin puede eliminar
  StaffTypeController.delete
);

module.exports = router;