const express = require('express');
const router = express.Router();
const StaffController = require('../../controllers/core/StaffController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

// Ruta GET / - Obtener todo el personal
router.get(
  '/',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  StaffController.getAll
);

// Ruta POST / - Crear nuevo personal
router.post(
  '/',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador']),
  StaffController.create
);

// Ruta GET /:id - Obtener personal específico (faltante)
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  StaffController.getById
);

// Ruta PUT /:id - Actualizar personal
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador']),
  StaffController.update
);

// Ruta PATCH /:id/asistencia - Actualizar asistencia
router.patch(
  '/:id/asistencia',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador']),
  StaffController.updateAsistencia
);

module.exports = router;