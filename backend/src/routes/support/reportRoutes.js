const express = require('express');
const router = express.Router();
const ReportController = require('../../controllers/support/reportController');
const { 
    authenticateJWT, 
    checkRole 
} = require('../../middlewares/auth');

console.log('Inicializando rutas de Reportes...'); // Log de inicio

// ----------------------------------------
// Ruta GET: Obtener todos los reportes
// Permisos: Admin (todos), Coordinador (limitado), Líder (sus eventos)
// Descripción: Lista reportes según permisos
// ----------------------------------------
router.get(
    '/',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador', 'Líder']),
    (req, res, next) => {
        console.log(`[REPORT] GET / - Solicitado por usuario ${req.user._id} (${req.user.role})`);
        console.log('Filtros aplicables:', {
            Admin: 'Acceso completo',
            Coordinador: 'Solo sus reportes y generales',
            Líder: 'Solo reportes de sus eventos (72h)'
        });
        next();
    },
    ReportController.getAll
);

// ----------------------------------------
// Ruta POST: Crear nuevo reporte
// Permisos: Admin, Coordinador
// Validaciones: Campos requeridos y referencias
// ----------------------------------------
router.post(
    '/',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador']),
    (req, res, next) => {
        console.log(`[REPORT] POST / - Creación solicitada por ${req.user._id}`);
        console.log('Datos recibidos:', {
            tipo: req.body.type,
            título: req.body.title,
            prioridad: req.body.priority
        });
        next();
    },
    ReportController.create
);

// ----------------------------------------
// Ruta GET: Obtener reporte específico
// Permisos: Según pertenencia y tipo de reporte
// Restricciones: Filtrado de datos sensibles
// ----------------------------------------
router.get(
    '/:id',
    authenticateJWT,
    (req, res, next) => {
        console.log(`[REPORT] GET /${req.params.id} - Solicitado por ${req.user._id}`);
        console.log('Verificando permisos de acceso...');
        next();
    },
    ReportController.getById
);

// ----------------------------------------
// Ruta PUT: Actualizar reporte
// Permisos: Admin, Coordinador (sus reportes), Líder (sus eventos)
// Restricciones: Campos editables según rol
// ----------------------------------------
router.put(
    '/:id',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador', 'Líder']),
    (req, res, next) => {
        console.log(`[REPORT] PUT /${req.params.id} - Actualización solicitada por ${req.user._id}`);
        console.log('Campos a modificar:', Object.keys(req.body));
        if (req.user.role !== 'Admin' && req.body.status === 'resuelto') {
            console.warn('Intento de cambiar estado sin permisos');
        }
        next();
    },
    ReportController.update
);

// ----------------------------------------
// Ruta POST: Cerrar reporte
// Permisos: Admin, Coordinador
// Validaciones: Solución requerida
// ----------------------------------------
router.post(
    '/:id/close',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador']),
    (req, res, next) => {
        console.log(`[REPORT] POST /${req.params.id}/close - Cierre solicitado por ${req.user._id}`);
        console.log('Solución propuesta:', req.body.solution.substring(0, 50) + '...');
        next();
    },
    ReportController.closeReport
);

// ----------------------------------------
// Ruta POST: Agregar nota a reporte
// Permisos: Todos los roles autenticados
// Validaciones: Contenido requerido
// ----------------------------------------
router.post(
    '/:id/notes',
    authenticateJWT,
    (req, res, next) => {
        console.log(`[REPORT] POST /${req.params.id}/notes - Nueva nota por ${req.user._id}`);
        console.log('Longitud de nota:', req.body.content.length, 'caracteres');
        next();
    },
    ReportController.addNote
);

// ----------------------------------------
// Ruta GET: Generar reporte financiero
// Permisos: Exclusivo Admin
// Descripción: Datos financieros detallados
// ----------------------------------------
router.get(
    '/financial/generate',
    authenticateJWT,
    checkRole(['Admin']),
    (req, res, next) => {
        console.log(`[REPORT] GET /financial/generate - Solicitado por Admin ${req.user.email}`);
        console.log('Parámetros:', {
            fechaInicio: req.query.startDate,
            fechaFin: req.query.endDate,
            tipoEvento: req.query.eventType
        });
        next();
    },
    ReportController.generateFinancialReport
);

// ----------------------------------------
// Ruta GET: Generar reporte operativo
// Permisos: Admin, Coordinador
// Restricciones: Coordinador ve versión resumida
// ----------------------------------------
router.get(
    '/operational/generate',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador']),
    (req, res, next) => {
        console.log(`[REPORT] GET /operational/generate - Solicitado por ${req.user.role}`);
        console.log('Nivel de detalle:', req.user.role === 'Admin' ? 'Completo' : 'Resumido');
        next();
    },
    ReportController.generateOperationalReport
);

console.log('Rutas de Reportes configuradas correctamente'); // Log de finalización
module.exports = router;