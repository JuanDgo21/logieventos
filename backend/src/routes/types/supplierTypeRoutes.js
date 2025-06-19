const express = require('express');
const router = express.Router();
const SupplierTypeController = require('../../controllers/types/SupplierTypeController');
const { authenticateJWT, checkRole } = require('../../middlewares/auth');

// GET / - Get all supplier types (filtered by role)
router.get(
  '/',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  SupplierTypeController.getAll
);

// POST / - Create new supplier type (admin only)
router.post(
  '/',
  authenticateJWT,
  checkRole(['admin']),
  SupplierTypeController.create
);

// GET /:id - Get specific supplier type
router.get(
  '/:id',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  SupplierTypeController.getById
);

// GET /:id/suppliers - Get suppliers by type
router.get(
  '/:id/suppliers',
  authenticateJWT,
  checkRole(['admin', 'coordinador', 'lider']),
  SupplierTypeController.getSuppliersByType
);

// PUT /:id - Update supplier type (admin only)
router.put(
  '/:id',
  authenticateJWT,
  checkRole(['admin']),
  SupplierTypeController.update
);

// PATCH /:id/deactivate - Deactivate supplier type (admin only)
router.patch(
  '/:id/deactivate',
  authenticateJWT,
  checkRole(['admin']),
  SupplierTypeController.deactivate
);

module.exports = router;