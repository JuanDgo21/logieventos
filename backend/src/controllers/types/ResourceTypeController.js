const ResourceType = require('./../../models/types/ResourceType');
const Resource = require('./../../models/core/Resource'); // ¡Importación faltante!

// Helper para logs (en español)
const log = (accion, mensaje) => console.log(`[CONTROLADOR DE TIPOS DE RECURSO] ${accion}: ${mensaje}`);

// 1. Crear un tipo de recurso
exports.createResourceType = async (req, res) => {
    log('Crear tipo de recurso', `Datos recibidos: ${JSON.stringify(req.body)}`);
    try {
        const { resourceTypeId, typeName } = req.body;

        // Validar campos obligatorios
        if (!resourceTypeId || !typeName) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios (resourceTypeId y typeName)'
            });
        }

        // Validar ID único
        const existingType = await ResourceType.findOne({ resourceTypeId });
        if (existingType) {
            return res.status(400).json({
                success: false,
                message: 'El ID del tipo de recurso ya está en uso'
            });
        }

        // Validar longitud máxima
        if (typeName.length > 45) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del tipo no puede exceder los 45 caracteres'
            });
        }

        const newResourceType = await ResourceType.create({
            resourceTypeId,
            typeName
        });

        res.status(201).json({
            success: true,
            message: 'Tipo de recurso creado exitosamente',
            data: newResourceType
        });
    } catch (error) {
        log('Error al crear tipo de recurso', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno al crear el tipo de recurso',
            error: error.message
        });
    }
};

// 2. Obtener todos los tipos de recurso
exports.getAllResourceTypes = async (req, res) => {
    log('Obtener todos los tipos de recurso', 'Iniciando');
    try {
        const resourceTypes = await ResourceType.find().sort({ typeName: 1 });

        res.status(200).json({
            success: true,
            total: resourceTypes.length,
            data: resourceTypes
        });
    } catch (error) {
        log('Error al obtener tipos de recurso', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno al listar los tipos de recurso'
        });
    }
};

// 3. Obtener un tipo de recurso por ID
exports.getResourceTypeById = async (req, res) => {
    log('Obtener tipo de recurso por ID', `ID: ${req.params.id}`);
    try {
        const resourceType = await ResourceType.findById(req.params.id);

        if (!resourceType) {
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
        log('Error al obtener tipo de recurso', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno al buscar el tipo de recurso'
        });
    }
};

// 4. Actualizar un tipo de recurso
exports.updateResourceType = async (req, res) => {
    log('Actualizar tipo de recurso', `ID: ${req.params.id}`);
    try {
        const { typeName } = req.body;

        // Validar longitud máxima
        if (typeName && typeName.length > 45) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del tipo no puede exceder los 45 caracteres'
            });
        }

        const updatedResourceType = await ResourceType.findByIdAndUpdate(
            req.params.id,
            { typeName },
            { new: true, runValidators: true }
        );

        if (!updatedResourceType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tipo de recurso actualizado correctamente',
            data: updatedResourceType
        });
    } catch (error) {
        log('Error al actualizar tipo de recurso', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno al actualizar el tipo de recurso'
        });
    }
};

// ... (resto de imports y configuraciones)

exports.deleteResourceType = async (req, res) => {
    log('Eliminar tipo de recurso', `ID: ${req.params.id}`);
    try {
        // Validar que no esté en uso por algún recurso
        const isUsed = await Resource.exists({ resourceTypeId: req.params.id }); // Antes: Resource no estaba definido
        if (isUsed) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar: hay recursos asociados a este tipo'
            });
        }

        const deletedResourceType = await ResourceType.findByIdAndDelete(req.params.id);
        if (!deletedResourceType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tipo de recurso eliminado correctamente'
        });
    } catch (error) {
        log('Error al eliminar tipo de recurso', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno al eliminar el tipo de recurso',
            error: error.message // Detalle técnico para depuración
        });
    }
};