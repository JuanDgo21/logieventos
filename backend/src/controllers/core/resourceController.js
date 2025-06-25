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
            .populate('resourceTypeId') // Incluye el tipo de recurso
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

// Obtener recurso específico por ID
exports.getResourceById = async (req, res) => {
    console.log('[RECURSO CONTROLLER] Ejecutando getRecursoById para ID:', req.params.id);
    try {
        const recurso = await Recurso.findById(req.params.id);

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
        console.error('[RECURSO CONTROLLER] Error en getRecursoById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el recurso'
        });
    }
};

// 2. Crear recurso (con validación de ResourceType)
exports.createResource = async (req, res) => {
    log('Crear recurso', `Datos recibidos: ${JSON.stringify(req.body)}`);
    try {
        const { resourceId, name, quantity, availability, maintenance, resourceTypeId } = req.body;

        // Validar campos obligatorios
        if (!resourceId || !name || !quantity || !availability || !maintenance || !resourceTypeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios, incluyendo el ID del tipo de recurso' 
            });
        }

        // Validar que el ResourceType exista
        const typeExists = await ResourceType.findById(resourceTypeId);
        if (!typeExists) {
            return res.status(404).json({ 
                success: false, 
                message: 'El tipo de recurso especificado no existe' 
            });
        }

        // Validar ID único
        const existingResource = await Resource.findOne({ resourceId });
        if (existingResource) {
            return res.status(400).json({ 
                success: false, 
                message: 'El ID del recurso ya está en uso' 
            });
        }

        const newResource = await Resource.create({
            resourceId,
            name,
            quantity,
            availability,
            maintenance,
            resourceTypeId
        });

        res.status(201).json({
            success: true,
            message: 'Recurso creado exitosamente',
            data: newResource
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

// 3. Actualizar recurso
exports.updateResource = async (req, res) => {
    log('Actualizar recurso', `ID: ${req.params.id}`);
    try {
        const { name, quantity, availability, maintenance, resourceTypeId } = req.body;
        const updateData = { name, quantity, availability, maintenance };

        // Validar ResourceType si se envía
        if (resourceTypeId) {
            const typeExists = await ResourceType.findById(resourceTypeId);
            if (!typeExists) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'El tipo de recurso especificado no existe' 
                });
            }
            updateData.resourceTypeId = resourceTypeId;
        }

        const updatedResource = await Resource.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('resourceTypeId');

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

// 4. Eliminar recurso
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

// 5. Obtener recursos disponibles (adicional)
exports.getAvailableResources = async (req, res) => {
    log('Obtener recursos disponibles', 'Iniciando');
    try {
        const resources = await Resource.find({ availability: 'Disponible' })
            .select('resourceId name quantity')
            .populate('resourceTypeId');

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