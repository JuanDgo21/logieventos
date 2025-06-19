const express = require('express');
const router = express.Router();
const SuppliersController = require('../../controllers/core/suppliersController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

// POST / - Create supplier (admin, Coordinator)
router.post(
  '/',
  authenticateJWT,
  checkRole(['admin', 'coordinador']),
  SuppliersController.create
);

// GET / - Get all suppliers (filtered by role)
router.get(
  '/',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  SuppliersController.getAll
);

// GET /:id - Get specific supplier
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  SuppliersController.getById
);

// PUT /:id - Update supplier (admin: full, Coordinator: partial)
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['admin', 'coordinador']),
  SuppliersController.update
);

// PATCH /:id/status - Change supplier status (admin only)
router.patch(
  '/:id/status',
  authenticateJWT,
  checkRole(['admin']),
  SuppliersController.changeStatus
);

// GET /type/:typeId - Get suppliers by type
router.get(
  '/type/:typeId',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  SuppliersController.getByType
);

module.exports = router;