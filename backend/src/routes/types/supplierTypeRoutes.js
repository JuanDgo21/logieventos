const express = require('express');
const router = express.Router();
const SupplierTypeController = require('../../controllers/types/SupplierTypeController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

// GET / - Get all supplier types (filtered by role)
router.get(
  '/',
  authenticateJWT,
  checkRole(['Admin', 'Coordinator', 'Leader']),
  SupplierTypeController.getAll
);

// POST / - Create new supplier type (Admin only)
router.post(
  '/',
  authenticateJWT,
  checkRole(['Admin']),
  SupplierTypeController.create
);

// GET /:id - Get specific supplier type
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['Admin', 'Coordinator', 'Leader']),
  SupplierTypeController.getById
);

// GET /:id/suppliers - Get suppliers by type
router.get(
  '/:id/suppliers',
  authenticateJWT,
  checkRole(['Admin', 'Coordinator', 'Leader']),
  SupplierTypeController.getSuppliersByType
);

// PUT /:id - Update supplier type (Admin only)
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['Admin']),
  SupplierTypeController.update
);

// PATCH /:id/deactivate - Deactivate supplier type (Admin only)
router.patch(
  '/:id/deactivate',
  authenticateJWT,
  checkRole(['Admin']),
  SupplierTypeController.deactivate
);

module.exports = router;