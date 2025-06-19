const express = require('express');
const router = express.Router();
const StaffController = require('../../controllers/core/StaffController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

// Ruta GET / - Obtener todo el personal
router.get(
  '/',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  StaffController.getAll
);

// Ruta POST / - Crear nuevo personal
router.post(
  '/',
  authenticateJWT,
  checkRole(['admin', 'coordinador']),
  StaffController.create
);

// Ruta GET /:id - Obtener personal específico (faltante)
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  StaffController.getById
);

// Ruta PUT /:id - Actualizar personal
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['admin', 'coordinador']),
  StaffController.update
);

// Ruta PATCH /:id/asistencia - Actualizar asistencia
router.patch(
  '/:id/asistencia',
  authenticateJWT,
  checkRole(['admin', 'coordinador']),
  StaffController.updateAsistencia
);

module.exports = router;