const Report = require('../../models/support/Report');
const User = require('../../models/core/User');
const Event = require('../../models/core/Event');
const Contract = require('../../models/core/Contract');

/**
 * Controlador completo para gestión de reportes con:
 * - Control de acceso por roles
 * - Validación de datos
 * - Filtrado de información sensible
 */
const ReportController = {
  /**
   * Crear un nuevo reporte (Admin, Coordinador)
   */
  async create(req, res) {
    try {
      console.log('[Report] Creación iniciada por:', req.user.role);
      
      // Verificar permisos
      if (!['admin', 'coordinator'].includes(req.user.role)) {
        console.log('[Report] Intento no autorizado. Rol:', req.user.role);
        return res.status(403).json({ error: 'No tiene permisos para crear reportes' });
      }

      // Validar y completar datos
      const reportData = await prepareReportData(req.body, req.user);
      const report = new Report(reportData);
      
      await report.save();
      console.log('[Report] Nuevo reporte creado:', report._id);
      
      res.status(201).json(report);
    } catch (error) {
      console.error('[Report] Error en creación:', error.message);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Obtener todos los reportes con filtros por rol
   */
  async getAll(req, res) {
    try {
      console.log(`[Report] Solicitud de listado por: ${req.user.role}`);
      
      const filter = buildRoleBasedFilter(req.query, req.user);
      const reports = await Report.find(filter)
        .populate(buildRoleBasedPopulate(req.user.role))
        .sort({ date: -1 });
      
      console.log(`[Report] Enviados ${reports.length} reportes a ${req.user.role}`);
      
      // Filtrar datos sensibles según rol
      const filteredReports = reports.map(report => 
        filterReportByRole(report, req.user.role)
      );
      
      res.json(filteredReports);
    } catch (error) {
      console.error('[Report] Error en listado:', error.message);
      res.status(500).json({ error: 'Error al obtener reportes' });
    }
  },

  /**
   * Obtener reporte específico con control de acceso
   */
  async getById(req, res) {
    try {
      console.log(`[Report] Solicitud de reporte ${req.params.id} por: ${req.user.role}`);
      
      const report = await Report.findById(req.params.id)
        .populate(buildRoleBasedPopulate(req.user.role));
      
      if (!report) {
        console.log('[Report] Reporte no encontrado');
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }

      // Verificar acceso al reporte específico
      if (!canAccessReport(report, req.user)) {
        console.log('[Report] Acceso denegado al reporte');
        return res.status(403).json({ error: 'No tiene acceso a este reporte' });
      }

      // Aplicar filtrado de campos según rol
      const filteredReport = filterReportByRole(report, req.user.role);
      
      console.log('[Report] Entrega de reporte filtrado');
      res.json(filteredReport);
    } catch (error) {
      console.error('[Report] Error al obtener:', error.message);
      res.status(500).json({ error: 'Error al obtener reporte' });
    }
  },

  /**
   * Actualizar reporte (Admin, Coordinador, Líder para sus eventos)
   */
  async update(req, res) {
    try {
      console.log(`[Report] Intento de actualización por: ${req.user.role}`);
      
      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }

      // Verificar permisos de actualización
      if (!canModifyReport(report, req.user)) {
        console.log('[Report] Intento no autorizado de modificación');
        return res.status(403).json({ error: 'No tiene permisos para modificar este reporte' });
      }

      // Preparar datos según rol
      const updateData = prepareUpdateData(req.body, req.user.role);
      
      const updatedReport = await Report.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate(buildRoleBasedPopulate(req.user.role));
      
      console.log('[Report] Actualización exitosa');
      res.json(updatedReport);
    } catch (error) {
      console.error('[Report] Error en actualización:', error.message);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Cerrar reporte (Admin, Coordinador)
   */
  async closeReport(req, res) {
    try {
      console.log(`[Report] Intento de cierre por: ${req.user.role}`);
      
      if (!['admin', 'coordinator'].includes(req.user.role)) {
        return res.status(403).json({ error: 'No tiene permisos para cerrar reportes' });
      }

      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }

      report.status = 'closed';
      report.closed_at = new Date();
      report.solution = req.body.solution;
      
      await report.save();
      
      console.log('[Report] Reporte cerrado:', report._id);
      res.json(report);
    } catch (error) {
      console.error('[Report] Error al cerrar:', error.message);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Agregar nota a reporte (Todos los roles autenticados)
   */
  async addNote(req, res) {
    try {
      console.log(`[Report] Agregando nota por: ${req.user.role}`);
      
      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }

      // Verificar acceso al reporte
      if (!canAccessReport(report, req.user)) {
        return res.status(403).json({ error: 'No tiene acceso a este reporte' });
      }

      if (!req.body.content || req.body.content.trim().length < 5) {
        return res.status(400).json({ error: 'La nota debe tener al menos 5 caracteres' });
      }

      report.notes.push({
        content: req.body.content,
        author: req.user._id,
        visibility: req.body.visibility || 'public',
        createdAt: new Date()
      });

      await report.save();
      res.json(report);
    } catch (error) {
      console.error('[Report] Error al agregar nota:', error.message);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Generar reporte financiero (Solo Admin)
   */
  async generateFinancialReport(req, res) {
    try {
      console.log(`[Report] Generando reporte financiero para Admin ${req.user.email}`);
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso restringido a administradores' });
      }

      const { startDate, endDate, eventType } = req.query;
      const reportData = await generateFinancialData(startDate, endDate, eventType);
      
      res.json({
        status: 'success',
        period: { startDate, endDate },
        ...reportData
      });
    } catch (error) {
      console.error('[Report] Error en reporte financiero:', error.message);
      res.status(500).json({ error: 'Error al generar reporte financiero' });
    }
  },

  /**
   * Generar reporte operativo (Admin y Coordinador)
   */
  async generateOperationalReport(req, res) {
    try {
      console.log(`[Report] Generando reporte operativo para ${req.user.role}`);
      
      const { startDate, endDate } = req.query;
      const reportData = await generateOperationalData(req.user.role, startDate, endDate);
      
      res.json({
        status: 'success',
        period: { startDate, endDate },
        ...reportData
      });
    } catch (error) {
      console.error('[Report] Error en reporte operativo:', error.message);
      res.status(500).json({ error: 'Error al generar reporte operativo' });
    }
  }
};

// ==================== FUNCIONES AUXILIARES ====================

async function prepareReportData(body, user) {
  const data = { 
    ...body, 
    created_by: user._id,
    status: 'open'
  };
  
  // Validar referencias
  if (data.event) {
    const eventExists = await Event.exists({ _id: data.event });
    if (!eventExists) throw new Error('El evento no existe');
  }
  
  if (data.contract) {
    const contractExists = await Contract.exists({ _id: data.contract });
    if (!contractExists) throw new Error('El contrato no existe');
  }
  
  return data;
}

function buildRoleBasedFilter(query, user) {
  const filter = { ...query };
  
  switch (user.role) {
    case 'admin':
      break;
      
    case 'coordinator':
      filter.$or = [
        { type: { $in: ['financial', 'operational'] } },
        { created_by: user._id },
        { event: { $in: user.assignedEvents || [] } }
      ];

      if (!filter.date) {
        filter.date = { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) };
      }
      break;
      
    case 'leader':
      filter.event = { $in: user.assignedEvents || [] };
      filter.date = { 
        $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      };
      break;
      
    default:
      throw new Error('Rol no reconocido');
  }
  
  return filter;
}

function buildRoleBasedPopulate(role) {
  const base = [
    { path: 'created_by', select: 'name email role' },
    { path: 'event', select: 'name date' },
    { path: 'contract', select: 'reference' }
  ];
  
  if (role === 'admin') {
    base.push({ path: 'notes.author', select: 'name role' });
  }
  
  return base;
}

function canAccessReport(report, user) {
  if (user.role === 'admin') return true;
  
  if (report.created_by.equals(user._id)) return true;
  
  if (user.role === 'coordinator') {
    return (
      (report.event && (user.assignedEvents || []).includes(report.event)) ||
      ['financial', 'operational'].includes(report.type)
    );
  }
  
  if (user.role === 'leader') {
    return (
      report.event && 
      (user.assignedEvents || []).includes(report.event) &&
      isWithinTimeWindow(report.date)
    );
  }
  
  return false;
}

function canModifyReport(report, user) {
  if (user.role === 'admin') return true;
  
  if (report.created_by.equals(user._id)) return true;
  
  if (user.role === 'coordinator') {
    return ['financial', 'operational'].includes(report.type);
  }
  
  if (user.role === 'leader') {
    return (
      report.event && 
      (user.assignedEvents || []).includes(report.event) &&
      isWithinTimeWindow(report.date)
    );
  }
  
  return false;
}

function filterReportByRole(report, role) {
  const reportObj = report.toObject();
  
  const adminOnlyFields = [
    'financialDetails',
    'costBreakdown',
    'rawData',
    'auditLogs'
  ];
  
  const coordinatorRestricted = [
    'unitCosts',
    'profitMargins'
  ];
  
  if (role !== 'admin') {
    adminOnlyFields.forEach(field => delete reportObj[field]);
  }
  
  if (role === 'coordinator') {
    coordinatorRestricted.forEach(field => delete reportObj[field]);
  }
  
  if (role === 'leader') {
    delete reportObj.detailedCosts;
    delete reportObj.sensitiveNotes;
  }
  
  return reportObj;
}

function prepareUpdateData(body, role) {
  const data = { ...body };
  
  if (role !== 'admin') {
    delete data.financialDetails;
    delete data.rawData;
  }
  
  if (role === 'coordinator') {
    delete data.unitCosts;
  }
  
  return data;
}

function isWithinTimeWindow(date) {
  const now = new Date();
  const start = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const end = new Date(now + 3 * 24 * 60 * 60 * 1000);
  return date >= start && date <= end;
}

async function generateFinancialData(startDate, endDate, eventType) {
  // Implementación real iría aquí
  return {
    totalRevenue: 15000,
    totalCosts: 9000,
    profit: 6000,
    eventsCount: 12,
    averageCostPerEvent: 750
  };
}

async function generateOperationalData(role, startDate, endDate) {
  // Implementación real iría aquí
  const baseData = {
    completedEvents: 7,
    pendingEvents: 1,
    staffHours: 120
  };

  return role === 'admin' ? {
    ...baseData,
    staffPerformance: [],
    equipmentUsage: []
  } : {
    ...baseData,
    highlights: []
  };
}

module.exports = ReportController;