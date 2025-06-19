const Report = require('../../models/support/Report');
const User = require('../../models/core/User');
const Event = require('../../models/core/Event');
const Contract = require('../../models/core/Contract');

/**
 * Controlador para gestión de reportes con control de acceso por roles
 */
const ReportController = {
  /**
   * Crear un nuevo reporte (admin, Coordinador)
   */
  async create(req, res) {
    try {
      console.log('[Report] Creación iniciada por:', req.user.role);
      
      // Verificar permisos
      if (!['admin', 'coordinador'].includes(req.user.role)) {
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
   * Obtener reportes con filtros por rol
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
   * Actualizar reporte (admin, Coordinador, Líder para sus eventos)
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
   * Cerrar reporte (admin, Coordinador)
   */
  async closeReport(req, res) {
    try {
      console.log(`[Report] Intento de cierre por: ${req.user.role}`);
      
      if (!['admin', 'coordinador'].includes(req.user.role)) {
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
   * Eliminar reporte (Solo admin)
   */
  async delete(req, res) {
    try {
      console.log(`[Report] Intento de eliminación por: ${req.user.role}`);
      
      if (req.user.role !== 'admin') {
        console.log('[Report] Intento no autorizado de eliminación');
        return res.status(403).json({ error: 'Solo administradores pueden eliminar reportes' });
      }

      const report = await Report.findByIdAndDelete(req.params.id);
      
      if (!report) {
        console.log('[Report] Reporte no encontrado para eliminar');
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }

      console.log('[Report] Reporte eliminado exitosamente');
      res.json({ message: 'Reporte eliminado correctamente' });
    } catch (error) {
      console.error('[Report] Error al eliminar:', error.message);
      res.status(500).json({ error: 'Error al eliminar reporte' });
    }
  }
};

// ==================== HELPERS ====================

/**
 * Prepara los datos del reporte antes de crear
 */
async function prepareReportData(body, user) {
  const data = { ...body, created_by: user._id };
  
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

/**
 * Construye filtro basado en rol del usuario
 */
function buildRoleBasedFilter(query, user) {
  const filter = { ...query };
  
  switch (user.role) {
    case 'admin':
      break;
      
    case 'coordinador':
      filter.$or = [
        { type: { $in: ['financial', 'operational'] } },
        { created_by: user._id },
        { event: { $in: user.assignedEvents || [] } }
      ];

      if (!filter.date) {
        filter.date = { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) };
      }
      break;
      
    case 'lider':
      filter.event = { $in: user.assignedEvents || [] };
      filter.date = { 
        $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      };
      break;
      
    case 'staff':
    case 'supplier':
      filter.$or = [
        { created_by: user._id },
        { event: { $in: user.associatedEvents || [] } }
      ];
      break;
      
    default:
      throw new Error('Rol no reconocido');
  }
  
  return filter;
}

/**
 * Determina las relaciones a popular según rol
 */
function buildRoleBasedPopulate(role) {
  const base = [
    { path: 'created_by', select: 'name email' },
    { path: 'event', select: 'name' },
    { path: 'contract', select: 'name' }
  ];
  
  if (role === 'admin') {
    base.push({ path: 'notes.author', select: 'name role' });
  }
  
  return base;
}

/**
 * Verifica si el usuario puede acceder a un reporte
 */
function canAccessReport(report, user) {
  if (user.role === 'admin') return true;
  
  if (report.created_by.equals(user._id)) return true;
  
  if (user.role === 'coordinador') {
    return (
      (report.event && (user.assignedEvents || []).includes(report.event)) ||
      ['financial', 'operational'].includes(report.type)
    );
  }
  
  if (user.role === 'lider') {
    return (
      report.event && 
      (user.assignedEvents || []).includes(report.event) &&
      isWithinTimeWindow(report.date)
    );
  }
  
  if (['staff', 'supplier'].includes(user.role)) {
    return (
      (report.event && (user.associatedEvents || []).includes(report.event))
    );
  }
  
  return false;
}

/**
 * Verifica si el usuario puede modificar un reporte
 */
function canModifyReport(report, user) {
  if (user.role === 'admin') return true;
  
  if (report.created_by.equals(user._id)) return true;
  
  if (user.role === 'coordinador') {
    return ['financial', 'operational'].includes(report.type);
  }
  
  if (user.role === 'lider') {
    return (
      report.event && 
      (user.assignedEvents || []).includes(report.event) &&
      isWithinTimeWindow(report.date)
    );
  }
  
  return false;
}

/**
 * Filtra los campos del reporte según el rol
 */
function filterReportByRole(report, role) {
  const reportObj = report.toObject();
  
  // Campos sensibles
  const adminOnlyFields = [
    'financialDetails',
    'costBreakdown',
    'rawData',
    'auditLogs'
  ];
  
  // Campos restringidos
  const coordinadorRestricted = [
    'unitCosts',
    'profitMargins'
  ];
  
  // Aplicar filtros
  if (role !== 'admin') {
    adminOnlyFields.forEach(field => delete reportObj[field]);
  }
  
  if (role === 'coordinador') {
    coordinadorRestricted.forEach(field => delete reportObj[field]);
  }
  
  if (role === 'lider') {
    delete reportObj.detailedCosts;
    delete reportObj.sensitiveNotes;
  }
  
  if (['staff', 'supplier'].includes(role)) {
    return {
      _id: reportObj._id,
      title: reportObj.title,
      date: reportObj.date,
      status: reportObj.status
    };
  }
  
  return reportObj;
}

/**
 * Prepara datos de actualización según rol
 */
function prepareUpdateData(body, role) {
  const data = { ...body };
  
  if (role !== 'admin') {
    delete data.financialDetails;
    delete data.rawData;
  }
  
  if (role === 'coordinador') {
    delete data.unitCosts;
  }
  
  return data;
}

/**
 * Verifica si una fecha está dentro del rango permitido para líderes
 */
function isWithinTimeWindow(date) {
  const now = new Date();
  const start = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const end = new Date(now + 3 * 24 * 60 * 60 * 1000);
  return date >= start && date <= end;
}

module.exports = ReportController;