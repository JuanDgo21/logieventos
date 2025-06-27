const Resource = require('./../../models/core/Resource');
const ResourceType = require('./../../models/types/ResourceType');
const Event = require('./../../models/core/Event');

// Helper para logs (en español)
const log = (accion, mensaje) => console.log(`[CONTROLADOR DE RECURSOS] ${accion}: ${mensaje}`);

// 1. Obtener todos los recursos
exports.getAllResources = async (req, res) => {
    log('Obtener todos los recursos', 'Iniciando');
    try {
        const { availability, maintenance } = req.query;
        let query = {};
        
        if (availability) query.availability = availability;
        if (maintenance) query.maintenance = maintenance;

        const resources = await Resource.find(query)
            .populate('resourceType') // Actualizado para usar resourceType
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            total: resources.length,
            data: resources
        });
    } catch (error) {
        log('Error al obtener recursos', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al listar los recursos' 
        });
    }
};

// 2. Obtener recurso por ID
exports.getResourceById = async (req, res) => {
    log('Obtener recurso por ID', `ID: ${req.params.id}`);
    try {
        const resource = await Resource.findById(req.params.id)
            .populate('resourceType'); // Añadido populate

        if (!resource) {
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
        log('Error al obtener recurso', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el recurso'
        });
    }
};

// 3. Crear recurso
exports.createResource = async (req, res) => {
    log('Crear recurso', `Datos recibidos: ${JSON.stringify(req.body)}`);
    try {
        const { name, quantity, availability, maintenance, resourceType } = req.body;

        // Validar campos obligatorios
        if (!name || !quantity || !availability || !maintenance || !resourceType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios, incluyendo el tipo de recurso' 
            });
        }

        // Validar que el ResourceType exista
        const typeExists = await ResourceType.findById(resourceType);
        if (!typeExists) {
            return res.status(404).json({ 
                success: false, 
                message: 'El tipo de recurso especificado no existe' 
            });
        }

        const newResource = await Resource.create({
            name,
            quantity,
            availability,
            maintenance,
            resourceType
        });

        res.status(201).json({
            success: true,
            message: 'Recurso creado exitosamente',
            data: await newResource.populate('resourceType') // Devuelve el recurso con el tipo poblado
        });
    } catch (error) {
        log('Error al crear recurso', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al crear el recurso',
            error: error.message 
        });
    }
};

// 4. Actualizar recurso
exports.updateResource = async (req, res) => {
    log('Actualizar recurso', `ID: ${req.params.id}`);
    try {
        const { name, quantity, availability, maintenance, resourceType } = req.body;
        const updateData = { name, quantity, availability, maintenance };

        // Validar ResourceType si se envía
        if (resourceType) {
            const typeExists = await ResourceType.findById(resourceType);
            if (!typeExists) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'El tipo de recurso especificado no existe' 
                });
            }
            updateData.resourceType = resourceType;
        }

        const updatedResource = await Resource.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('resourceType');

        if (!updatedResource) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recurso no encontrado' 
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recurso actualizado correctamente',
            data: updatedResource
        });
    } catch (error) {
        log('Error al actualizar recurso', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al actualizar el recurso' 
        });
    }
};

// 5. Eliminar recurso
exports.deleteResource = async (req, res) => {
    log('Eliminar recurso', `ID: ${req.params.id}`);
    try {
        // Verificar si el recurso está asignado a un evento
        const isAssigned = await Event.exists({ resources: req.params.id });
        if (isAssigned) {
            return res.status(400).json({ 
                success: false, 
                message: 'No se puede eliminar el recurso porque está asignado a un evento' 
            });
        }

        const deletedResource = await Resource.findByIdAndDelete(req.params.id);
        if (!deletedResource) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recurso no encontrado' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Recurso eliminado correctamente' 
        });
    } catch (error) {
        log('Error al eliminar recurso', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al eliminar el recurso' 
        });
    }
};

// 6. Obtener recursos disponibles
exports.getAvailableResources = async (req, res) => {
    log('Obtener recursos disponibles', 'Iniciando');
    try {
        const resources = await Resource.find({ availability: 'Disponible' })
            .select('name quantity')
            .populate('resourceType');

        res.status(200).json({
            success: true,
            total: resources.length,
            data: resources
        });
    } catch (error) {
        log('Error al obtener recursos disponibles', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al listar recursos disponibles' 
        });
    }
};