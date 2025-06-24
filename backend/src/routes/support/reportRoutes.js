const express = require('express');
const router = express.Router();
const ReportController = require('../../controllers/support/reportController');
const { verifyToken } = require('../../middlewares/authJwt');  // ✔️ Usa verifyToken en lugar de verifyToken
const { checkRole } = require('../../middlewares/role');       // ✔️ Importa checkRole desde el archivo correcto

console.log('Inicializando rutas de Reportes...');

// Mapeo de roles para consistencia
const ROLES = {
  admin: 'admin',
  coordinador: 'coordinador',
  lider: 'lider',
  staff: 'staff',
  supplier: 'supplier'
};

// ----------------------------------------
// Ruta GET: Obtener todos los reportes
// ----------------------------------------
router.get(
    '/',
    verifyToken,
    checkRole([ROLES.admin, ROLES.coordinador, ROLES.lider]),
    (req, res, next) => {
        console.log(`[REPORT] GET / - Solicitado por usuario ${req.user._id} (${req.user.role})`);
        next();
    },
    ReportController.getAll
);

// ----------------------------------------
// Ruta POST: Crear nuevo reporte
// ----------------------------------------
router.post(
    '/',
    verifyToken,
    checkRole([ROLES.admin, ROLES.coordinador]),
    (req, res, next) => {
        console.log(`[REPORT] POST / - Creación solicitada por ${req.user._id}`);
        next();
    },
    ReportController.create
);

// ----------------------------------------
// Ruta GET: Obtener reporte específico
// ----------------------------------------
router.get(
    '/:id',
    verifyToken,
    (req, res, next) => {
        console.log(`[REPORT] GET /${req.params.id} - Solicitado por ${req.user._id}`);
        next();
    },
    ReportController.getById
);

// ----------------------------------------
// Ruta PUT: Actualizar reporte
// ----------------------------------------
router.put(
    '/:id',
    verifyToken,
    checkRole([ROLES.admin, ROLES.coordinador, ROLES.lider]),
    (req, res, next) => {
        console.log(`[REPORT] PUT /${req.params.id} - Actualización solicitada por ${req.user._id}`);
        next();
    },
    ReportController.update
);

// ----------------------------------------
// Ruta POST: Cerrar reporte
// ----------------------------------------
router.post(
    '/:id/close',
    verifyToken,
    checkRole([ROLES.admin, ROLES.coordinador]),
    (req, res, next) => {
        console.log(`[REPORT] POST /${req.params.id}/close - Cierre solicitado por ${req.user._id}`);
        next();
    },
    ReportController.closeReport
);

// ----------------------------------------
// Ruta DELETE: Eliminar reporte (solo admin)
// ----------------------------------------
router.delete(
    '/:id',
    verifyToken,
    checkRole([ROLES.admin]),
    (req, res, next) => {
        console.log(`[REPORT] DELETE /${req.params.id} - Eliminación solicitada por admin`);
        next();
    },
    ReportController.delete
);

console.log('Rutas de Reportes configuradas correctamente');
module.exports = router;