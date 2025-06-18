const Evento = require('../../models/core/Event');
const { verifyToken, checkRole } = require('../../middlewares/authJwt');

// Crear nuevo evento
exports.createEvent = async (req, res) => {
    try {
        const { name, description, location, startDate, endDate, requiredResources } = req.body;

        // Validacion basica
        if (!name || !startDate || !endDate) {
            return res.status(400).json({ message: 'Nombre y fechas son obligatorios' });
        }

        const newEvent = new Evento({
            ...req.body,
            manager: req.userId,
            createdBy: req.userId
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);

    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({ message: 'Error al crear el evento' });
        }
    };

// Obtener todos los eventos
exports.getAllEvents = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const filter = {};

        if ( startDate && endDate) {
            filter.startDate = { $gte: new Date(startDate)};
            filter.endDate = { $lte: new Date(endDate) };
    }

    if (status) {
        filter.status = status;
    }

    const events = await Evento.find(filter)
     .populate('responsable', 'name email')
     .populate('requiredResources.assignedProvider', 'companyName contact')
     .populate('assignedStaff.employee', 'name role');

    res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener eventos', error });
    }
};

// Obtener un evento por ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Evento.findById(req.params.id)
            .populate('responsable', 'name email')
            .populate('requiredResources.assignedProvider')
            .populate('assignedStaff.employee');

        if (!event) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el evento', error });
    }
};

// Actualizar un evento
exports.updateEvent = async (req, res) => {
    try {
        const updatedEvent = await Evento.findByIdAndUpdate( req.params.id,
            {...req.body, lastmodified: Date.now() },
            { new: true, runValidators: true }
        ).populate('responsable');

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el evento', error });
    }
};

// Eliminar un evento
exports.deleteEvent = async (req, res) => {
    try {
        const deletedEvent = await Evento.findByIdAndDelete(req.params.id,
            { status: 'Eliminado', active: false },
            { new: true }
        );

        if (!deletedEvent) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }
        res.status(200).json({ message: 'Evento eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el evento', error });
    }
};

// Controlador especial: Asignar proveedor a recurso
exports.assingProviderToResource = async (req, res) => {
    try {
        const { eventId, resourceIndex, providerId } = req.params;

        if (!Evento) {
            return res.status(400).json({ message: 'Evento no encontrado' });
        }

        if (resourceIndex >= Evento.requiredResources.length) {
            return res.status(400).json({ message: 'Recurso no encontrado' });
        }

        Evento.requiredResources[resourceIndex].assignedProvider = providerId;
        Evento.lastmodified = Date.now();

        const updatedEvent = await event.save();
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: 'Error al asignar proveedor al recurso', error });
    }
};