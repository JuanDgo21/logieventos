const Event = require('../../models/core/Event');
const EventType = require('../../models/types/EventType');
const Contract = require('../../models/core/Contract');
const User = require('../../models/core/User');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Helper para validar referencias
const validateReferences = async (eventTypeId, contractId, responsableId) => {
    const [eventType, contract, user] = await Promise.all([
        EventType.findById(eventTypeId),
        Contract.findById(contractId),
        User.findById(responsableId)
    ]);

    const errors = [];
    if (!eventType) errors.push('El tipo de evento no existe');
    if (!contract) errors.push('El contrato no existe');
    if (!user) errors.push('El responsable no existe');

    return errors.length ? { valid: false, errors } : { valid: true };
};

// Crear un nuevo evento
exports.createEvent = [
    verifyToken,
    checkRole(['admin', 'coordinador']),
    async (req, res) => {
        try {
            const { eventType, contract, responsable, startDate, endDate, ...rest } = req.body;

            // Validar referencias
            const { valid, errors } = await validateReferences(eventType, contract, responsable);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Error de referencias',
                    errors
                });
            }

            // Validar fechas
            if (new Date(endDate) <= new Date(startDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de fin debe ser posterior a la de inicio'
                });
            }

            const newEvent = new Event({
                ...rest,
                eventType,
                contract,
                responsable,
                startDate,
                endDate,
                createdBy: req.userId
            });

            const savedEvent = await newEvent.save();
            
            // Populate para devolver datos completos
            await savedEvent.populate(['eventType', 'contract', 'responsable']);

            res.status(201).json({
                success: true,
                message: 'Evento creado exitosamente',
                data: savedEvent
            });

        } catch (error) {
            console.error('Error al crear evento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear evento',
                error: error.message
            });
        }
    }
];

// Obtener todos los eventos (con filtros)
exports.getAllEvents = [
    verifyToken,
    async (req, res) => {
        try {
            const { startDate, endDate, status, eventType } = req.query;
            const filter = {};

            // Filtros
            if (startDate && endDate) {
                filter.startDate = { $gte: new Date(startDate) };
                filter.endDate = { $lte: new Date(endDate) };
            }
            if (status) filter.status = status;
            if (eventType) filter.eventType = eventType;

            // Si es líder, solo ver sus eventos asignados
            if (req.userRole === 'lider') {
                filter.responsable = req.userId;
            }

            const events = await Event.find(filter)
                .populate('eventType contract responsable')
                .sort({ startDate: 1 });

            res.status(200).json({
                success: true,
                count: events.length,
                data: events
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener eventos',
                error: error.message
            });
        }
    }
];

// Obtener un evento por ID
exports.getEventById = [
    verifyToken,
    async (req, res) => {
        try {
            const event = await Event.findById(req.params.id)
                .populate('eventType contract responsable createdBy');

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            // Verificar permisos (admin/coordinador o responsable del evento)
            if (req.userRole !== 'admin' && 
                req.userRole !== 'coordinador' && 
                event.responsable._id.toString() !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver este evento'
                });
            }

            res.status(200).json({
                success: true,
                data: event
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener el evento',
                error: error.message
            });
        }
    }
];

// Actualizar un evento
exports.updateEvent = [
    verifyToken,
    checkRole(['admin', 'coordinador']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Buscar evento existente
            const existingEvent = await Event.findById(id);
            if (!existingEvent) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            // Validar permisos (lider solo puede actualizar sus eventos)
            if (req.userRole === 'lider' && existingEvent.responsable.toString() !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo puedes modificar tus eventos asignados'
                });
            }

            // Validar fechas si se actualizan
            if (updates.startDate || updates.endDate) {
                const start = updates.startDate || existingEvent.startDate;
                const end = updates.endDate || existingEvent.endDate;
                if (new Date(end) <= new Date(start)) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de fin debe ser posterior a la de inicio'
                    });
                }
            }

            // Actualizar
            const updatedEvent = await Event.findByIdAndUpdate(
                id,
                { ...updates, lastModified: new Date() },
                { new: true, runValidators: true }
            ).populate('eventType contract responsable');

            res.status(200).json({
                success: true,
                message: 'Evento actualizado exitosamente',
                data: updatedEvent
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el evento',
                error: error.message
            });
        }
    }
];

// Cambiar estado de un evento
exports.changeEventStatus = [
    verifyToken,
    checkRole(['admin', 'coordinador', 'lider']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validar estado
            const validStatuses = ['planeación', 'confirmado', 'en_curso', 'completado', 'cancelado'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado no válido'
                });
            }

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            // Validar permisos (lider solo puede cambiar a en_curso/completado)
            if (req.userRole === 'lider') {
                if (!['en_curso', 'completado'].includes(status)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Solo puedes cambiar a "en_curso" o "completado"'
                    });
                }
                if (event.responsable.toString() !== req.userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Solo puedes cambiar estado de tus eventos'
                    });
                }
            }

            // Actualizar estado
            event.status = status;
            if (status === 'completado') event.completedAt = new Date();
            await event.save();

            res.status(200).json({
                success: true,
                message: `Estado del evento actualizado a "${status}"`,
                data: event
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado del evento',
                error: error.message
            });
        }
    }
];

// Eliminar evento (solo admin)
exports.deleteEvent = [
    verifyToken,
    checkRole(['admin']),
    async (req, res) => {
        try {
            const deletedEvent = await Event.findByIdAndDelete(req.params.id);
            
            if (!deletedEvent) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Evento eliminado exitosamente'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el evento',
                error: error.message
            });
        }
    }
];

// :3