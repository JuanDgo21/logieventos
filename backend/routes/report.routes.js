const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportControllers');
const { authJwt, role } = require('../middlewares');

// ========================
// CRUD BÁSICO DE REPORTES
// ========================

// Crear reporte manual (opcional)
router.post('/',
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador'])],
  reportController.createReport
);

// Obtener todos los reportes
router.get('/',
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador', 'lider'])],
  reportController.getAllReports
);

// Obtener reporte por ID
router.get('/:id',
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador', 'lider'])],
  reportController.getReportById
);

// Actualizar reporte
router.put('/:id',
  [authJwt.verifyToken, role.checkRole(['admin'])],
  reportController.updateReport
);

// Eliminar reporte
router.delete('/:id',
  [authJwt.verifyToken, role.isAdmin],
  reportController.deleteReport
);

// =====================================================
// RUTA ESPECIAL: CREAR REPORTE AUTOMÁTICO DESDE CONTRATOS
// =====================================================

router.post('/from-contracts',
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador'])],
  async (req, res) => {
    try {
      const Contract = require('../models/Contract');
      const Report = require('../models/Report');

      // Traer todos los contratos populados con sus relaciones
      const contratos = await Contract.find()
        .populate('event')
        .populate({
          path: 'event',
          populate: { path: 'eventType', model: 'EventType' }
        })
        .populate('createdBy', 'name email')
        .lean();

      const nuevoReporte = new Report({
        title: "Reporte completo de contratos",
        description: "Este reporte contiene todos los contratos con sus eventos, tipos de evento y responsables.",
        type: "contract",
        data: contratos,
        createdBy: req.userId
      });

      await nuevoReporte.save();

      res.status(201).json({
        success: true,
        message: 'Reporte creado con todos los contratos y sus detalles',
        data: nuevoReporte
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte desde contratos',
        error: error.message
      });
    }
  }
);

module.exports = router;
    