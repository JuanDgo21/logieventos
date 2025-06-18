const Report = require('../../models/support/Report');
const User = require('../../models/core/User');
const Event = require('../../models/core/Event');

// Obtener todos los reportes (Admin y coordinador)
exports.getAllReports = async (req, res) => {
    console.log('[REPORT CONTROLLER] Ejecutando getAllReports');
    try {
        let query = {};
        
        // Filtros por rol
        if (req.user.role === 'coordinador') {
            query = { $or: [{ createdBy: req.user.id }, { visibility: 'public' }] };
        } else if (req.user.role === 'auxiliar') {
            query = { createdBy: req.user.id };
        }

        const reports = await Report.find(query)
            .populate('createdBy', 'username email -_id')
            .populate('relatedEvent', 'title startDate -_id')
            .sort({ createdAt: -1 });

        console.log(`[REPORT CONTROLLER] ${reports.length} reportes encontrados`);
        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        console.error('[REPORT CONTROLLER] Error en getAllReports:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los reportes'
        });
    }
};

// Obtener reporte específico
exports.getReportById = async (req, res) => {
    console.log('[REPORT CONTROLLER] Ejecutando getReportById para ID:', req.params.id);
    try {
        const report = await Report.findById(req.params.id)
            .populate('createdBy', 'username email -_id')
            .populate('relatedEvent', 'title startDate -_id');

        if (!report) {
            console.log('[REPORT CONTROLLER] Reporte no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        // Validar acceso
        if (req.user.role !== 'admin' && 
            report.visibility === 'private' && 
            report.createdBy.toString() !== req.user.id) {
            console.log('[REPORT CONTROLLER] Acceso no autorizado');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a este reporte'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('[REPORT CONTROLLER] Error en getReportById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el reporte',
            error: error.message
        });
    }
};

// Crear nuevo reporte
exports.createReport = async (req, res) => {
    console.log('[REPORT CONTROLLER] Ejecutando createReport');
    try {
        const { title, description, type, relatedEvent, visibility } = req.body;

        // Validar evento relacionado si existe
        if (relatedEvent) {
            const eventExists = await Event.exists({ _id: relatedEvent });
            if (!eventExists) {
                console.log('[REPORT CONTROLLER] Evento relacionado no encontrado');
                return res.status(400).json({
                    success: false,
                    message: 'El evento relacionado no existe'
                });
            }
        }

        const newReport = new Report({
            title,
            description,
            type,
            relatedEvent: relatedEvent || null,
            createdBy: req.user.id,
            visibility: visibility || 'private',
            status: 'open'
        });

        const savedReport = await newReport.save();
        
        // Populate para la respuesta
        const populatedReport = await Report.findById(savedReport._id)
            .populate('createdBy', 'username -_id')
            .populate('relatedEvent', 'title -_id');

        console.log('[REPORT CONTROLLER] Reporte creado:', populatedReport._id);
        res.status(201).json({
            success: true,
            message: 'Reporte creado exitosamente',
            data: populatedReport
        });
    } catch (error) {
        console.error('[REPORT CONTROLLER] Error en createReport:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al crear el reporte',
            error: error.message
        });
    }
};

// Actualizar reporte (Creador, Admin y coordinador)
exports.updateReport = async (req, res) => {
    console.log('[REPORT CONTROLLER] Ejecutando updateReport para ID:', req.params.id);
    try {
        // Obtener reporte existente
        const existingReport = await Report.findById(req.params.id);
        if (!existingReport) {
            console.log('[REPORT CONTROLLER] Reporte no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        // Validar permisos
        if (req.user.role !== 'admin' && 
            existingReport.createdBy.toString() !== req.user.id) {
            console.log('[REPORT CONTROLLER] No autorizado para actualizar');
            return res.status(403).json({
                success: false,
                message: 'No estás autorizado para actualizar este reporte'
            });
        }

        // Preparar datos para actualización
        const updateData = { ...req.body };
        
        // Solo admin puede cambiar el estado
        if (req.user.role !== 'admin' && 'status' in updateData) {
            delete updateData.status;
        }

        // Solo admin puede cambiar la visibilidad
        if (req.user.role !== 'admin' && 'visibility' in updateData) {
            delete updateData.visibility;
        }

        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('createdBy', 'username -_id')
         .populate('relatedEvent', 'title -_id');

        console.log('[REPORT CONTROLLER] Reporte actualizado:', updatedReport._id);
        res.status(200).json({
            success: true,
            message: 'Reporte actualizado exitosamente',
            data: updatedReport
        });
    } catch (error) {
        console.error('[REPORT CONTROLLER] Error en updateReport:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el reporte',
            error: error.message
        });
    }
};

// Cambiar estado de reporte (Admin y coordinador)
exports.changeReportStatus = async (req, res) => {
    console.log('[REPORT CONTROLLER] Ejecutando changeReportStatus para ID:', req.params.id);
    try {
        const { status, resolutionNotes } = req.body;
        const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];

        if (!validStatuses.includes(status)) {
            console.log('[REPORT CONTROLLER] Estado no válido');
            return res.status(400).json({
                success: false,
                message: 'Estado no válido'
            });
        }

        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                resolutionNotes: status === 'resolved' ? resolutionNotes : null,
                resolvedAt: status === 'resolved' ? Date.now() : null,
                resolvedBy: status === 'resolved' ? req.user.id : null
            },
            { new: true }
        ).populate('createdBy', 'username -_id')
         .populate('resolvedBy', 'username -_id')
         .populate('relatedEvent', 'title -_id');

        if (!updatedReport) {
            console.log('[REPORT CONTROLLER] Reporte no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        console.log('[REPORT CONTROLLER] Estado de reporte actualizado:', updatedReport.status);
        res.status(200).json({
            success: true,
            message: 'Estado de reporte actualizado exitosamente',
            data: updatedReport
        });
    } catch (error) {
        console.error('[REPORT CONTROLLER] Error en changeReportStatus:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado del reporte',
            error: error.message
        });
    }
};

// Eliminar reporte (Admin y creador)
exports.deleteReport = async (req, res) => {
    console.log('[REPORT CONTROLLER] Ejecutando deleteReport para ID:', req.params.id);
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            console.log('[REPORT CONTROLLER] Reporte no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        // Validar permisos
        if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
            console.log('[REPORT CONTROLLER] No autorizado para eliminar');
            return res.status(403).json({
                success: false,
                message: 'No estás autorizado para eliminar este reporte'
            });
        }

        const deletedReport = await Report.findByIdAndDelete(req.params.id);
        console.log('[REPORT CONTROLLER] Reporte eliminado:', deletedReport._id);

        res.status(200).json({
            success: true,
            message: 'Reporte eliminado exitosamente'
        });
    } catch (error) {
        console.error('[REPORT CONTROLLER] Error en deleteReport:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el reporte'
        });
    }
};

// Obtener reportes por evento
exports.getReportsByEvent = async (req, res) => {
    console.log('[REPORT CONTROLLER] Ejecutando getReportsByEvent para evento ID:', req.params.eventId);
    try {
        // Verificar que el evento existe
        const eventExists = await Event.exists({ _id: req.params.eventId });
        if (!eventExists) {
            console.log('[REPORT CONTROLLER] Evento no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        let query = { relatedEvent: req.params.eventId };
        
        // Filtros por rol
        if (req.user.role === 'coordinador') {
            query = { 
                $and: [
                    { relatedEvent: req.params.eventId },
                    { $or: [{ createdBy: req.user.id }, { visibility: 'public' }] }
                ]
            };
        } else if (req.user.role === 'auxiliar') {
            query = { 
                $and: [
                    { relatedEvent: req.params.eventId },
                    { createdBy: req.user.id }
                ]
            };
        }

        const reports = await Report.find(query)
            .populate('createdBy', 'username -_id')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        console.error('[REPORT CONTROLLER] Error en getReportsByEvent:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reportes por evento'
        });
    }
};

// Obtener estadísticas de reportes (Admin)
exports.getReportStatistics = async (req, res) => {
    console.log('[REPORT CONTROLLER] Ejecutando getReportStatistics');
    try {
        if (req.user.role !== 'admin') {
            console.log('[REPORT CONTROLLER] Acceso no autorizado a estadísticas');
            return res.status(403).json({
                success: false,
                message: 'No estás autorizado para ver estas estadísticas'
            });
        }

        const stats = await Report.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    latest: { $max: '$createdAt' }
                }
            },
            {
                $project: {
                    status: '$_id',
                    count: 1,
                    latest: 1,
                    _id: 0
                }
            }
        ]);

        const total = await Report.countDocuments();
        const resolvedLastMonth = await Report.countDocuments({
            status: 'resolved',
            resolvedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        res.status(200).json({
            success: true,
            data: {
                stats,
                total,
                resolvedLastMonth
            }
        });
    } catch (error) {
        console.error('[REPORT CONTROLLER] Error en getReportStatistics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de reportes'
        });
    }
};