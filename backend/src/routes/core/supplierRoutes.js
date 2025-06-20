const express = require('express');
const router = express.Router();
const SuppliersController = require('../../controllers/core/suppliersController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

console.log('Inicializando rutas de proveedores...');

// ----------------------------------------
// Ruta: Crear nuevo proveedor
// ----------------------------------------
router.post(
  '/',
  verifyToken,
  checkRole(['Admin', 'Coordinador']),
  (req, res, next) => {
    console.log(`POST /suppliers - Usuario: ${req.user._id} Rol: ${req.user.role}`);
    next();
  },
  SuppliersController.createSupplier // Cambiado de create a createSupplier
);

// ----------------------------------------
// Ruta: Obtener todos los proveedores
// ----------------------------------------
router.get(
  '/',
  verifyToken,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  SuppliersController.getAllSuppliers // Cambiado de getAll a getAllSuppliers
);

// ----------------------------------------
// Ruta: Obtener proveedor específico
// ----------------------------------------
router.get(
  '/:id',
  verifyToken,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  SuppliersController.getSupplierById // Cambiado de getById a getSupplierById
);

// ----------------------------------------
// Ruta: Actualizar proveedor
// ----------------------------------------
router.put(
  '/:id',
  verifyToken,
  checkRole(['Admin', 'Coordinador']),
  SuppliersController.updateSupplier // Cambiado de update a updateSupplier
);

// ----------------------------------------
// Ruta: Aprobar/Rechazar proveedor
// ----------------------------------------
router.post(
  '/:id/approve',
  verifyToken,
  checkRole(['Admin']),
  SuppliersController.changeSupplierStatus // Cambiado de approve a changeSupplierStatus
);

// ----------------------------------------
// Ruta: Calificar proveedor (requiere implementación)
// ----------------------------------------
router.post(
  '/:id/rate',
  verifyToken,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  (req, res) => res.status(501).json({ message: 'Por implementar' }) // Placeholder
);

// ----------------------------------------
// Ruta: Obtener proveedores por tipo
// ----------------------------------------
router.get(
  '/type/:typeId',
  verifyToken,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  SuppliersController.getSuppliersByType // Cambiado de getByType a getSuppliersByType
);

console.log('Rutas de proveedores configuradas correctamente');
module.exports = router;