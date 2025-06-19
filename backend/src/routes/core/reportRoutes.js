const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/support/reportController');
const { authenticate, authorize } = require('../../config/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Obtener todos los reportes
router.get('/', authorize(['admin', 'coordinador', 'auxiliar']), reportController.getAllReports);

// Obtener estadísticas de reportes (Solo Admin)
router.get('/stats', authorize(['admin']), reportController.getReportStatistics);

// Obtener reporte específico
router.get('/:id', authorize(['admin', 'coordinador', 'auxiliar']), reportController.getReportById);

// Crear nuevo reporte
router.post('/', authorize(['admin', 'coordinador', 'auxiliar']), reportController.createReport);

// Actualizar reporte
router.put('/:id', authorize(['admin', 'coordinador', 'auxiliar']), reportController.updateReport);

// Cambiar estado de reporte (Admin y coordinador)
router.patch('/:id/status', authorize(['admin', 'coordinador']), reportController.changeReportStatus);

// Eliminar reporte
router.delete('/:id', authorize(['admin', 'coordinador', 'auxiliar']), reportController.deleteReport);

// Obtener reportes por evento
router.get('/event/:eventId', authorize(['admin', 'coordinador', 'auxiliar']), reportController.getReportsByEvent);

module.exports = router;