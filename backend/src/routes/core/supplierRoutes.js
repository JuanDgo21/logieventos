const express = require('express');
const router = express.Router();
const SuppliersController = require('../../controllers/core/suppliersController');
const { verifyToken } = require('../../middlewares/authJwt');  // ✔️ Usa verifyToken en lugar de verifyToken
const { checkRole } = require('../../middlewares/role');       // ✔️ Importa checkRole desde el archivo correcto

// POST / - Create supplier (admin, Coordinator)
router.post(
  '/',
  verifyToken,
  checkRole(['admin', 'coordinador']),
  SuppliersController.create
);

// GET / - Get all suppliers (filtered by role)
router.get(
  '/',
  verifyToken,
  checkRole(['admin', 'coordinador', 'lider']),
  SuppliersController.getAll
);

// GET /:id - Get specific supplier
router.get(
  '/:id',
  verifyToken,
  checkRole(['admin', 'coordinador', 'lider']),
  SuppliersController.getById
);

// PUT /:id - Update supplier (admin: full, Coordinator: partial)
router.put(
  '/:id',
  verifyToken,
  checkRole(['admin', 'coordinador']),
  SuppliersController.update
);

// PATCH /:id/status - Change supplier status (admin only)
router.patch(
  '/:id/status',
  verifyToken,
  checkRole(['admin']),
  SuppliersController.changeStatus
);

// GET /type/:typeId - Get suppliers by type
router.get(
  '/type/:typeId',
  verifyToken,
  checkRole(['admin', 'coordinador', 'lider']),
  SuppliersController.getByType
);

module.exports = router;