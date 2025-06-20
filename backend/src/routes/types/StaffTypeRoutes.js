const express = require('express');
const router = express.Router();
const SupplierTypeController = require('../../controllers/types/supplierTypeController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

console.log('Inicializando rutas de SupplierType...');

// ----------------------------------------
// Ruta: Obtener categorías principales (Público)
// ----------------------------------------
router.get(
  '/main-categories',
  (req, res, next) => {
    console.log('Solicitud GET /supplier-types/main-categories recibida');
    next();
  },
  SupplierTypeController.getMainCategories
);

// ----------------------------------------
// Ruta: Obtener subcategorías por categoría principal (Público)
// ----------------------------------------
router.get(
  '/:mainCategory/subcategories',
  (req, res, next) => {
    console.log(`Solicitud GET /supplier-types/${req.params.mainCategory}/subcategories recibida`);
    next();
  },
  SupplierTypeController.getSubcategories
);

// ----------------------------------------
// Ruta: Obtener todas las subcategorías (Admin, Coordinador, Líder)
// ----------------------------------------
router.get(
  '/',
  verifyToken,
  checkRole(['Admin', 'Coordinador', 'Líder']),
  (req, res, next) => {
    console.log(`Solicitud GET /supplier-types recibida - Usuario: ${req.user._id} Rol: ${req.user.role}`);
    console.log('Filtros aplicados:', req.query);
    next();
  },
  SupplierTypeController.getAllSubcategories
);

// ----------------------------------------
// Ruta: Crear subcategoría (Solo Admin)
// ----------------------------------------
router.post(
  '/',
  verifyToken,
  checkRole(['Admin']),
  (req, res, next) => {
    console.log(`Solicitud POST /supplier-types recibida - Usuario: ${req.user._id}`);
    console.log('Datos recibidos:', req.body);
    next();
  },
  SupplierTypeController.createSubcategory
);

// ----------------------------------------
// Ruta: Actualizar subcategoría (Admin y Coordinador)
// ----------------------------------------
router.put(
  '/:id',
  verifyToken,
  checkRole(['Admin', 'Coordinador']),
  (req, res, next) => {
    console.log(`Solicitud PUT /supplier-types/${req.params.id} recibida - Usuario: ${req.user._id}`);
    console.log('Datos de actualización:', req.body);
    next();
  },
  SupplierTypeController.updateSubcategory
);

// ----------------------------------------
// Ruta: Eliminación lógica de subcategoría (Solo Admin)
// ----------------------------------------
router.delete(
  '/:id',
  verifyToken,
  checkRole(['Admin']),
  (req, res, next) => {
    console.log(`Solicitud DELETE /supplier-types/${req.params.id} recibida - Usuario: ${req.user._id}`);
    next();
  },
  SupplierTypeController.deleteSubcategory
);

console.log('Rutas de SupplierType configuradas correctamente');
module.exports = router;