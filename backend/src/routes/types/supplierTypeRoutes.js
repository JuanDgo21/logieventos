const express = require('express');
const router = express.Router();
const SupplierTypeController = require('../../controllers/types/SupplierTypeController');
const { verifyToken } = require('../../middlewares/authJwt');  // ✔️ Usa verifyToken en lugar de verifyToken
const { checkRole } = require('../../middlewares/role');       // ✔️ Importa checkRole desde el archivo correcto

// GET / - Get all supplier types (filtered by role)
router.get(
  '/',
  verifyToken,
  checkRole(['admin', 'coordinador', 'lider']),
  SupplierTypeController.getAll
);

// POST / - Create new supplier type (admin only)
router.post(
  '/',
  verifyToken,
  checkRole(['admin']),
  SupplierTypeController.create
);

// GET /:id - Get specific supplier type
router.get(
  '/:id',
  verifyToken,
  checkRole(['admin', 'coordinador', 'lider']),
  SupplierTypeController.getById
);

// GET /:id/suppliers - Get suppliers by type
router.get(
  '/:id/suppliers',
  verifyToken,
  checkRole(['admin', 'coordinador', 'lider']),
  SupplierTypeController.getSuppliersByType
);

// PUT /:id - Update supplier type (admin only)
router.put(
  '/:id',
  verifyToken,
  checkRole(['admin']),
  SupplierTypeController.update
);

// PATCH /:id/deactivate - Deactivate supplier type (admin only)
router.patch(
  '/:id/deactivate',
  verifyToken,
  checkRole(['admin']),
  SupplierTypeController.deactivate
);

module.exports = router;