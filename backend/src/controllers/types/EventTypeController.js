const EventType = require('../../models/types/EventType');
const { verifyToken, checkRole } = require('../../middlewares/authJwt');

// Crear nuevo tipo de evento
exports.createEventType = async (req, res) => {
    try {
        const { name, category } = req.body;

        // Validacion basica
        if (!name || !category) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y categoria son obligatorios' 
            });
        }

        // Verificar si ya existe
        const existingType = await EventType.findOne({ name });

        if (existingType) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un tipo de evento con ese nombre'
            });
        }

        const newEventType = new EventType({
            ...req.body,
            createdBy: req.userId
        });

        const savedType = await newEventType.save();
        res.status(201).json({
            success: true,
            message: 'Tipo de evento creado exitosamente',
            data: savedType
        });

    } catch (error) {
        console.error('Error al crear tipo de eventos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el tipo de evento',
            error: error.message
        });
    }
};

// Obtener todos los tipos de eventos
exports.getAllEventTypes = async (req, res) => {
    try {
        const { includeInactive } = req.query;
        const filter = includeInactive === 'true' ? {} : { active: true };

        const EventType = await EventType.find(filter)
            .sort({ name: 1 })

        res.status(200).json({
            success: true,
            count: EventType.length,
            data: EventType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener tipos de eventos',
            error: error.message
        });
    }
};

// Obtener un tipo de evento por ID
exports.getEventTypeById = async (req, res) => {
    try {
        const eventType = await EventType.findById(req.params.id);

        if (!EventType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de evento no encontrado'
            });
        }

    res.status(200).json({
        success: true,
        data: EventType
    });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el tipo de evento',
            error: error.message
        });
    }
};

// Actualizar un tipo de evento
exports.updateEventType = async (req, res) => {
    try {
        const updates = {
            ...req.body,
            updateAt: Date.now(),
        };

        const updatedType = await EventType.findByIdAndUpdate(
            req.params.id,
            updates,
        { new: true, runValidators: true }
        );

        if (!updatedType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de evento no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tipo de evento actualizado exitosamente',
            data: updatedType
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el tipo de evento',
            error: error.message
        });
    }
};

// Desactivar un tipo de evento
exports.deactivateEventType = async (req, res) => {
    try {
        const deactivatedType = await EventType.findByIdAndUpdate(
            req.params.id,
            { active: false, updatedAt: Date.now() },
            { new: true }
        );

        if (!deactivatedType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de evento no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tipo de evento desactivado exitosamente',
            data: deactivatedType
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al desactivar el tipo de evento',
            error: error.message
        });
    }
};

// Movimiento