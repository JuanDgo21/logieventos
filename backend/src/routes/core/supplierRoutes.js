const express = require('express');
const router = express.Router();
const SuppliersController = require('../../controllers/core/suppliersController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

// POST / - Create supplier (Admin, Coordinator)
router.post(
  '/',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador']),
  SuppliersController.create
);

// GET / - Get all suppliers (filtered by role)
router.get(
  '/',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  SuppliersController.getAll
);

// GET /:id - Get specific supplier
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  SuppliersController.getById
);

// PUT /:id - Update supplier (Admin: full, Coordinator: partial)
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador']),
  SuppliersController.update
);

// PATCH /:id/status - Change supplier status (Admin only)
router.patch(
  '/:id/status',
  authenticateJWT,
  checkRole(['Admin']),
  SuppliersController.changeStatus
);

// GET /type/:typeId - Get suppliers by type
router.get(
  '/type/:typeId',
  authenticateJWT,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  SuppliersController.getByType
);

module.exports = router;