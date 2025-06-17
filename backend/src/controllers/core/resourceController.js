const Resource = require('../../models/core/Resource');
const ResourceType = require('../../models/core/ResourceType');
const Event = require('../../models/core/Event');

// Obtener todos los recursos
exports.getAllResources = async (req, res) => {
    console.log('[RESOURCE CONTROLLER] Ejecutando getAllResources');
    try {
        const { type, available, event } = req.query;
        let query = {};
        
        // Filtros opcionales
        if (type) query.type = type;
        if (available) query.available = available === 'true';
        if (event) query.events = event;

        const resources = await Resource.find(query)
            .populate('type', 'name description -_id')
            .populate('events', 'title startDate endDate -_id');

        console.log(`[RESOURCE CONTROLLER] ${resources.length} recursos encontrados`);
        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        console.error('[RESOURCE CONTROLLER] Error en getAllResources:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los recursos'
        });
    }
};

// Obtener recurso específico
exports.getResourceById = async (req, res) => {
    console.log('[RESOURCE CONTROLLER] Ejecutando getResourceById para ID:', req.params.id);
    try {
        const resource = await Resource.findById(req.params.id)
            .populate('type', 'name description -_id')
            .populate('events', 'title startDate endDate -_id');

        if (!resource) {
            console.log('[RESOURCE CONTROLLER] Recurso no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: resource
        });
    } catch (error) {
        console.error('[RESOURCE CONTROLLER] Error en getResourceById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el recurso',
            error: error.message
        });
    }
};

// Crear nuevo recurso (Admin y coordinador)
exports.createResource = async (req, res) => {
    console.log('[RESOURCE CONTROLLER] Ejecutando createResource');
    try {
        const { name, description, quantity, type, location } = req.body;

        // Validar tipo de recurso
        const resourceType = await ResourceType.findById(type);
        if (!resourceType) {
            console.log('[RESOURCE CONTROLLER] Tipo de recurso no válido');
            return res.status(400).json({
                success: false,
                message: 'Tipo de recurso no válido'
            });
        }

        const newResource = new Resource({
            name,
            description,
            quantity: quantity || 1,
            type,
            location,
            available: true
        });

        const savedResource = await newResource.save();
        
        // Populate para la respuesta
        const populatedResource = await Resource.findById(savedResource._id)
            .populate('type', 'name -_id');

        console.log('[RESOURCE CONTROLLER] Recurso creado:', populatedResource._id);
        res.status(201).json({
            success: true,
            message: 'Recurso creado exitosamente',
            data: populatedResource
        });
    } catch (error) {
        console.error('[RESOURCE CONTROLLER] Error en createResource:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al crear el recurso',
            error: error.message
        });
    }
};

// Actualizar recurso (Admin y coordinador)
exports.updateResource = async (req, res) => {
    console.log('[RESOURCE CONTROLLER] Ejecutando updateResource para ID:', req.params.id);
    try {
        // Validar tipo si se está actualizando
        if (req.body.type) {
            const resourceType = await ResourceType.findById(req.body.type);
            if (!resourceType) {
                console.log('[RESOURCE CONTROLLER] Tipo de recurso no válido');
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de recurso no válido'
                });
            }
        }

        const updatedResource = await Resource.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('type', 'name -_id');

        if (!updatedResource) {
            console.log('[RESOURCE CONTROLLER] Recurso no encontrado para actualizar');
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        console.log('[RESOURCE CONTROLLER] Recurso actualizado:', updatedResource._id);
        res.status(200).json({
            success: true,
            message: 'Recurso actualizado exitosamente',
            data: updatedResource
        });
    } catch (error) {
        console.error('[RESOURCE CONTROLLER] Error en updateResource:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el recurso',
            error: error.message
        });
    }
};

// Eliminar recurso (Solo Admin)
exports.deleteResource = async (req, res) => {
    console.log('[RESOURCE CONTROLLER] Ejecutando deleteResource para ID:', req.params.id);
    try {
        // Verificar que el recurso no esté asignado a eventos
        const resourceInEvents = await Event.exists({ resources: req.params.id });
        if (resourceInEvents) {
            console.log('[RESOURCE CONTROLLER] Intento de eliminar recurso asignado a eventos');
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el recurso porque está asignado a uno o más eventos'
            });
        }

        const deletedResource = await Resource.findByIdAndDelete(req.params.id);

        if (!deletedResource) {
            console.log('[RESOURCE CONTROLLER] Recurso no encontrado para eliminar');
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        console.log('[RESOURCE CONTROLLER] Recurso eliminado:', deletedResource._id);
        res.status(200).json({
            success: true,
            message: 'Recurso eliminado exitosamente'
        });
    } catch (error) {
        console.error('[RESOURCE CONTROLLER] Error en deleteResource:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el recurso'
        });
    }
};

// Asignar recurso a evento (Coordinador y admin)
exports.assignToEvent = async (req, res) => {
    console.log('[RESOURCE CONTROLLER] Ejecutando assignToEvent para recurso:', req.params.id, 'y evento:', req.body.eventId);
    try {
        const { eventId } = req.body;

        // Verificar que existe el evento
        const event = await Event.findById(eventId);
        if (!event) {
            console.log('[RESOURCE CONTROLLER] Evento no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        // Verificar que existe el recurso
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            console.log('[RESOURCE CONTROLLER] Recurso no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        // Verificar disponibilidad
        if (!resource.available) {
            console.log('[RESOURCE CONTROLLER] Recurso no disponible');
            return res.status(400).json({
                success: false,
                message: 'El recurso no está disponible'
            });
        }

        // Verificar que no esté ya asignado
        if (resource.events.includes(eventId)) {
            console.log('[RESOURCE CONTROLLER] Recurso ya asignado a este evento');
            return res.status(400).json({
                success: false,
                message: 'El recurso ya está asignado a este evento'
            });
        }

        // Actualizar recurso
        resource.events.push(eventId);
        resource.available = false;
        await resource.save();

        // Actualizar evento
        event.resources.push(req.params.id);
        await event.save();

        console.log('[RESOURCE CONTROLLER] Recurso asignado correctamente');
        res.status(200).json({
            success: true,
            message: 'Recurso asignado al evento exitosamente',
            data: {
                resourceId: resource._id,
                eventId: event._id,
                resourceName: resource.name,
                eventTitle: event.title
            }
        });
    } catch (error) {
        console.error('[RESOURCE CONTROLLER] Error en assignToEvent:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al asignar el recurso al evento',
            error: error.message
        });
    }
};

// Liberar recurso de evento (Coordinador y admin)
exports.releaseFromEvent = async (req, res) => {
    console.log('[RESOURCE CONTROLLER] Ejecutando releaseFromEvent para recurso:', req.params.id, 'y evento:', req.body.eventId);
    try {
        const { eventId } = req.body;

        // Verificar que existe el evento
        const event = await Event.findById(eventId);
        if (!event) {
            console.log('[RESOURCE CONTROLLER] Evento no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        // Verificar que existe el recurso
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            console.log('[RESOURCE CONTROLLER] Recurso no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        // Verificar que está asignado
        if (!resource.events.includes(eventId)) {
            console.log('[RESOURCE CONTROLLER] Recurso no asignado a este evento');
            return res.status(400).json({
                success: false,
                message: 'El recurso no está asignado a este evento'
            });
        }

        // Actualizar recurso
        resource.events = resource.events.filter(e => e.toString() !== eventId);
        resource.available = resource.events.length === 0;
        await resource.save();

        // Actualizar evento
        event.resources = event.resources.filter(r => r.toString() !== req.params.id);
        await event.save();

        console.log('[RESOURCE CONTROLLER] Recurso liberado correctamente');
        res.status(200).json({
            success: true,
            message: 'Recurso liberado del evento exitosamente',
            data: {
                resourceId: resource._id,
                eventId: event._id
            }
        });
    } catch (error) {
        console.error('[RESOURCE CONTROLLER] Error en releaseFromEvent:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al liberar el recurso del evento',
            error: error.message
        });
    }
};

// Obtener recursos disponibles
exports.getAvailableResources = async (req, res) => {
    console.log('[RESOURCE CONTROLLER] Ejecutando getAvailableResources');
    try {
        const resources = await Resource.find({ available: true })
            .populate('type', 'name -_id');

        console.log(`[RESOURCE CONTROLLER] ${resources.length} recursos disponibles encontrados`);
        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        console.error('[RESOURCE CONTROLLER] Error en getAvailableResources:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los recursos disponibles'
        });
    }
};