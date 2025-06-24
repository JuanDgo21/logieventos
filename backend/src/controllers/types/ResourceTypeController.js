const ResourceType = require('../../models/types/ResourceType');
const Resource = require('../../models/core/Resource');

// Obtener todos los tipos de recursos
exports.getAllResourceTypes = async (req, res) => {
    console.log('[RESOURCETYPE CONTROLLER] Ejecutando getAllResourceTypes');
    try {
        const resourceTypes = await ResourceType.find().sort({ tipo_recursos: 1 });
        console.log(`[RESOURCETYPE CONTROLLER] ${resourceTypes.length} tipos de recursos encontrados`);
        res.status(200).json({
            success: true,
            count: resourceTypes.length,
            data: resourceTypes
        });
    } catch (error) {
        console.error('[RESOURCETYPE CONTROLLER] Error en getAllResourceTypes:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los tipos de recursos'
        });
    }
};

// Obtener tipo de recurso específico
exports.getResourceTypeById = async (req, res) => {
    console.log('[RESOURCETYPE CONTROLLER] Ejecutando getResourceTypeById para ID:', req.params.id);
    try {
        const resourceType = await ResourceType.findById(req.params.id);

        if (!resourceType) {
            console.log('[RESOURCETYPE CONTROLLER] Tipo de recurso no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: resourceType
        });
    } catch (error) {
        console.error('[RESOURCETYPE CONTROLLER] Error en getResourceTypeById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el tipo de recurso',
            error: error.message
        });
    }
};

// Crear nuevo tipo de recurso (Solo Admin)
exports.createResourceType = async (req, res) => {
    console.log('[RESOURCETYPE CONTROLLER] Ejecutando createResourceType');
    try {
        const { totipo_recursos, tipo_recursos } = req.body;

        // Validar que no exista ya un tipo con el mismo totipo_recursos
        const existingType = await ResourceType.findOne({ totipo_recursos });
        if (existingType) {
            console.log('[RESOURCETYPE CONTROLLER] Tipo de recurso ya existe');
            return res.status(400).json({
                success: false,
                message: 'Ya existe un tipo de recurso con este identificador'
            });
        }

        const newResourceType = new ResourceType({
            totipo_recursos,
            tipo_recursos
        });

        const savedResourceType = await newResourceType.save();
        console.log('[RESOURCETYPE CONTROLLER] Tipo de recurso creado:', savedResourceType._id);

        res.status(201).json({
            success: true,
            message: 'Tipo de recurso creado exitosamente',
            data: savedResourceType
        });
    } catch (error) {
        console.error('[RESOURCETYPE CONTROLLER] Error en createResourceType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al crear el tipo de recurso',
            error: error.message
        });
    }
};

// Actualizar tipo de recurso (Solo Admin)
exports.updateResourceType = async (req, res) => {
    console.log('[RESOURCETYPE CONTROLLER] Ejecutando updateResourceType para ID:', req.params.id);
    try {
        // Verificar que el tipo existe
        const existingType = await ResourceType.findById(req.params.id);
        if (!existingType) {
            console.log('[RESOURCETYPE CONTROLLER] Tipo de recurso no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de recurso no encontrado'
            });
        }

        // Validar que el nuevo totipo_recursos no colisione con otro tipo
        if (req.body.totipo_recursos && req.body.totipo_recursos !== existingType.totipo_recursos) {
            const idExists = await ResourceType.findOne({ 
                totipo_recursos: req.body.totipo_recursos,
                _id: { $ne: req.params.id }
            });
            if (idExists) {
                console.log('[RESOURCETYPE CONTROLLER] Identificador de tipo ya existe');
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro tipo de recurso con este identificador'
                });
            }
        }

        const updatedResourceType = await ResourceType.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        console.log('[RESOURCETYPE CONTROLLER] Tipo de recurso actualizado:', updatedResourceType._id);
        res.status(200).json({
            success: true,
            message: 'Tipo de recurso actualizado exitosamente',
            data: updatedResourceType
        });
    } catch (error) {
        console.error('[RESOURCETYPE CONTROLLER] Error en updateResourceType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el tipo de recurso',
            error: error.message
        });
    }
};

// Eliminar tipo de recurso (Solo Admin, con validaciones)
exports.deleteResourceType = async (req, res) => {
    console.log('[RESOURCETYPE CONTROLLER] Ejecutando deleteResourceType para ID:', req.params.id);
    try {
        // Verificar que el tipo existe
        const resourceType = await ResourceType.findById(req.params.id);
        if (!resourceType) {
            console.log('[RESOURCETYPE CONTROLLER] Tipo de recurso no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de recurso no encontrado'
            });
        }

        // Verificar que no hay recursos asignados a este tipo
        const resourcesWithThisType = await Resource.findOne({ type: req.params.id });
        if (resourcesWithThisType) {
            console.log('[RESOURCETYPE CONTROLLER] Intento de eliminar tipo en uso');
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el tipo de recurso porque está asignado a uno o más recursos'
            });
        }

        const deletedResourceType = await ResourceType.findByIdAndDelete(req.params.id);
        console.log('[RESOURCETYPE CONTROLLER] Tipo de recurso eliminado:', deletedResourceType._id);

        res.status(200).json({
            success: true,
            message: 'Tipo de recurso eliminado exitosamente'
        });
    } catch (error) {
        console.error('[RESOURCETYPE CONTROLLER] Error en deleteResourceType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el tipo de recurso'
        });
    }
};

// Obtener recursos por tipo
exports.getResourcesByType = async (req, res) => {
    console.log('[RESOURCETYPE CONTROLLER] Ejecutando getResourcesByType para tipo:', req.params.id);
    try {
        // Verificar que el tipo existe
        const resourceType = await ResourceType.findById(req.params.id);
        if (!resourceType) {
            console.log('[RESOURCETYPE CONTROLLER] Tipo de recurso no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de recurso no encontrado'
            });
        }

        const resources = await Resource.find({ type: req.params.id })
            .populate('type', 'tipo_recursos -_id');

        res.status(200).json({
            success: true,
            data: {
                type: {
                    id: resourceType._id,
                    totipo_recursos: resourceType.totipo_recursos,
                    tipo_recursos: resourceType.tipo_recursos
                },
                resources: resources,
                count: resources.length
            }
        });
    } catch (error) {
        console.error('[RESOURCETYPE CONTROLLER] Error en getResourcesByType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los recursos por tipo'
        });
    }
};