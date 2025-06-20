const Recurso = require('../../models/core/Resource');
const Evento = require('../../models/core/Event');
const { isValidObjectId } = require('mongoose');

// Obtener todos los recursos
exports.getAllResources = async (req, res) => {
    try {
        const { disponibilidadR, mantenimientoR, tipoRecurso } = req.query;
        let query = {};
        
        if (disponibilidadR) query.disponibilidadR = disponibilidadR;
        if (mantenimientoR) query.mantenimientoR = mantenimientoR;
        if (tipoRecurso) query.tipoRecurso = tipoRecurso;

        const recursos = await Recurso.find(query)
            .populate('tipoRecurso', 'nombre')
            .populate('eventoAsignado', 'nombre')
            .sort({ nombreRecursos: 1 });

        res.status(200).json({
            success: true,
            count: recursos.length,
            data: recursos
        });
    } catch (error) {
        console.error('[ERROR] getAllResources:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recursos',
            error: error.message
        });
    }
};

// Obtener recursos disponibles
exports.getAvailableResources = async (req, res) => {
    try {
        const recursos = await Recurso.find({ 
            disponibilidadR: 'Disponible',
            mantenimientoR: { $ne: 'En Reparación' }
        })
        .select('idRecursos nombreRecursos cantidadRecursos tipoRecurso')
        .populate('tipoRecurso', 'nombre');

        res.status(200).json({
            success: true,
            count: recursos.length,
            data: recursos
        });
    } catch (error) {
        console.error('[ERROR] getAvailableResources:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recursos disponibles',
            error: error.message
        });
    }
};

// Obtener recurso por ID
exports.getResourceById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de recurso no válido'
            });
        }

        const recurso = await Recurso.findById(req.params.id)
            .populate('tipoRecurso')
            .populate('eventoAsignado');

        if (!recurso) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: recurso
        });
    } catch (error) {
        console.error('[ERROR] getResourceById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recurso',
            error: error.message
        });
    }
};

// Crear nuevo recurso
exports.createResource = async (req, res) => {
    try {
        const { idRecursos, nombreRecursos, cantidadRecursos, tipoRecurso } = req.body;

        // Validación básica
        if (!idRecursos || !nombreRecursos || !cantidadRecursos || !tipoRecurso) {
            return res.status(400).json({
                success: false,
                message: 'Campos obligatorios faltantes'
            });
        }

        // Verificar ID único
        const existeId = await Recurso.findOne({ idRecursos });
        if (existeId) {
            return res.status(400).json({
                success: false,
                message: 'El ID de recurso ya existe'
            });
        }

        const nuevoRecurso = new Recurso({
            ...req.body,
            disponibilidadR: 'Disponible',
            mantenimientoR: 'Operativo'
        });

        await nuevoRecurso.save();

        res.status(201).json({
            success: true,
            message: 'Recurso creado exitosamente',
            data: nuevoRecurso
        });
    } catch (error) {
        console.error('[ERROR] createResource:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear recurso',
            error: error.message
        });
    }
};

// Actualizar recurso
exports.updateResource = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['nombreRecursos', 'cantidadRecursos', 'mantenimientoR', 'tipoRecurso'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({
                success: false,
                message: 'Campos no permitidos para actualización'
            });
        }

        const recurso = await Recurso.findById(req.params.id);
        if (!recurso) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        updates.forEach(update => recurso[update] = req.body[update]);
        await recurso.save();

        res.status(200).json({
            success: true,
            message: 'Recurso actualizado',
            data: recurso
        });
    } catch (error) {
        console.error('[ERROR] updateResource:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar recurso',
            error: error.message
        });
    }
};

// Eliminar recurso
exports.deleteResource = async (req, res) => {
    try {
        const recurso = await Recurso.findById(req.params.id);
        if (!recurso) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        if (recurso.disponibilidadR === 'Asignado') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar un recurso asignado'
            });
        }

        await recurso.remove();
        res.status(200).json({
            success: true,
            message: 'Recurso eliminado'
        });
    } catch (error) {
        console.error('[ERROR] deleteResource:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar recurso',
            error: error.message
        });
    }
};

// Asignar recurso a evento
exports.assignToEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        
        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: 'ID de evento requerido'
            });
        }

        const [recurso, evento] = await Promise.all([
            Recurso.findById(req.params.id),
            Evento.findById(eventId)
        ]);

        if (!recurso || !evento) {
            return res.status(404).json({
                success: false,
                message: recurso ? 'Evento no encontrado' : 'Recurso no encontrado'
            });
        }

        if (recurso.disponibilidadR !== 'Disponible') {
            return res.status(400).json({
                success: false,
                message: 'El recurso no está disponible'
            });
        }

        recurso.disponibilidadR = 'Asignado';
        recurso.eventoAsignado = eventId;
        await recurso.save();

        res.status(200).json({
            success: true,
            message: 'Recurso asignado al evento',
            data: recurso
        });
    } catch (error) {
        console.error('[ERROR] assignToEvent:', error);
        res.status(500).json({
            success: false,
            message: 'Error al asignar recurso',
            error: error.message
        });
    }
};

// Liberar recurso de evento
exports.releaseFromEvent = async (req, res) => {
    try {
        const recurso = await Recurso.findById(req.params.id);
        if (!recurso) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        if (recurso.disponibilidadR !== 'Asignado') {
            return res.status(400).json({
                success: false,
                message: 'El recurso no está asignado'
            });
        }

        recurso.disponibilidadR = 'Disponible';
        recurso.eventoAsignado = null;
        await recurso.save();

        res.status(200).json({
            success: true,
            message: 'Recurso liberado',
            data: recurso
        });
    } catch (error) {
        console.error('[ERROR] releaseFromEvent:', error);
        res.status(500).json({
            success: false,
            message: 'Error al liberar recurso',
            error: error.message
        });
    }
};

// Obtener recursos por tipo
exports.getResourcesByType = async (req, res) => {
    try {
        const recursos = await Recurso.find({ tipoRecurso: req.params.typeId })
            .populate('tipoRecurso', 'nombre')
            .sort({ nombreRecursos: 1 });

        res.status(200).json({
            success: true,
            count: recursos.length,
            data: recursos
        });
    } catch (error) {
        console.error('[ERROR] getResourcesByType:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recursos por tipo',
            error: error.message
        });
    }
};

// Cambiar estado de mantenimiento
exports.updateMaintenanceStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatus = ['Operativo', 'En Reparación', 'Dañado'];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado de mantenimiento no válido'
            });
        }

        const recurso = await Recurso.findById(req.params.id);
        if (!recurso) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        recurso.mantenimientoR = status;
        if (status !== 'Operativo') {
            recurso.disponibilidadR = 'En Mantenimiento';
        } else {
            recurso.disponibilidadR = 'Disponible';
        }

        await recurso.save();
        res.status(200).json({
            success: true,
            message: 'Estado actualizado',
            data: recurso
        });
    } catch (error) {
        console.error('[ERROR] updateMaintenanceStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado',
            error: error.message
        });
    }
};