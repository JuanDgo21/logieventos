const StaffType = require('../../models/types/StaffType');
const Staff = require('../../models/core/Staff');

// Obtener todos los tipos de personal
exports.getAllStaffTypes = async (req, res) => {
    console.log('[STAFFTYPE CONTROLLER] Ejecutando getAllStaffTypes');
    try {
        const staffTypes = await StaffType.find().sort({ name: 1 });
        console.log(`[STAFFTYPE CONTROLLER] ${staffTypes.length} tipos de personal encontrados`);
        res.status(200).json({
            success: true,
            count: staffTypes.length,
            data: staffTypes
        });
    } catch (error) {
        console.error('[STAFFTYPE CONTROLLER] Error en getAllStaffTypes:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los tipos de personal'
        });
    }
};

// Obtener tipo de personal específico
exports.getStaffTypeById = async (req, res) => {
    console.log('[STAFFTYPE CONTROLLER] Ejecutando getStaffTypeById para ID:', req.params.id);
    try {
        const staffType = await StaffType.findById(req.params.id);

        if (!staffType) {
            console.log('[STAFFTYPE CONTROLLER] Tipo de personal no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: staffType
        });
    } catch (error) {
        console.error('[STAFFTYPE CONTROLLER] Error en getStaffTypeById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el tipo de personal',
            error: error.message
        });
    }
};

// Crear nuevo tipo de personal (Solo Admin)
exports.createStaffType = async (req, res) => {
    console.log('[STAFFTYPE CONTROLLER] Ejecutando createStaffType');
    try {
        const { name, description, permissions } = req.body;

        // Validar que no exista ya un tipo con el mismo nombre
        const existingType = await StaffType.findOne({ name });
        if (existingType) {
            console.log('[STAFFTYPE CONTROLLER] Tipo de personal ya existe');
            return res.status(400).json({
                success: false,
                message: 'Ya existe un tipo de personal con este nombre'
            });
        }

        const newStaffType = new StaffType({
            name,
            description,
            permissions: permissions || []
        });

        const savedStaffType = await newStaffType.save();
        console.log('[STAFFTYPE CONTROLLER] Tipo de personal creado:', savedStaffType._id);

        res.status(201).json({
            success: true,
            message: 'Tipo de personal creado exitosamente',
            data: savedStaffType
        });
    } catch (error) {
        console.error('[STAFFTYPE CONTROLLER] Error en createStaffType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al crear el tipo de personal',
            error: error.message
        });
    }
};

// Actualizar tipo de personal (Solo Admin)
exports.updateStaffType = async (req, res) => {
    console.log('[STAFFTYPE CONTROLLER] Ejecutando updateStaffType para ID:', req.params.id);
    try {
        // Verificar que el tipo existe
        const existingType = await StaffType.findById(req.params.id);
        if (!existingType) {
            console.log('[STAFFTYPE CONTROLLER] Tipo de personal no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        // Validar que el nuevo nombre no colisione con otro tipo
        if (req.body.name && req.body.name !== existingType.name) {
            const nameExists = await StaffType.findOne({ 
                name: req.body.name,
                _id: { $ne: req.params.id }
            });
            if (nameExists) {
                console.log('[STAFFTYPE CONTROLLER] Nombre de tipo ya existe');
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro tipo de personal con este nombre'
                });
            }
        }

        const updatedStaffType = await StaffType.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        console.log('[STAFFTYPE CONTROLLER] Tipo de personal actualizado:', updatedStaffType._id);
        res.status(200).json({
            success: true,
            message: 'Tipo de personal actualizado exitosamente',
            data: updatedStaffType
        });
    } catch (error) {
        console.error('[STAFFTYPE CONTROLLER] Error en updateStaffType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el tipo de personal',
            error: error.message
        });
    }
};

// Eliminar tipo de personal (Solo Admin, con validaciones)
exports.deleteStaffType = async (req, res) => {
    console.log('[STAFFTYPE CONTROLLER] Ejecutando deleteStaffType para ID:', req.params.id);
    try {
        // Verificar que el tipo existe
        const staffType = await StaffType.findById(req.params.id);
        if (!staffType) {
            console.log('[STAFFTYPE CONTROLLER] Tipo de personal no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        // Verificar que no hay personal asignado a este tipo
        const staffWithThisType = await Staff.findOne({ type: req.params.id });
        if (staffWithThisType) {
            console.log('[STAFFTYPE CONTROLLER] Intento de eliminar tipo en uso');
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el tipo de personal porque está asignado a uno o más miembros del personal'
            });
        }

        const deletedStaffType = await StaffType.findByIdAndDelete(req.params.id);
        console.log('[STAFFTYPE CONTROLLER] Tipo de personal eliminado:', deletedStaffType._id);

        res.status(200).json({
            success: true,
            message: 'Tipo de personal eliminado exitosamente'
        });
    } catch (error) {
        console.error('[STAFFTYPE CONTROLLER] Error en deleteStaffType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el tipo de personal'
        });
    }
};

// Obtener personal por tipo
exports.getStaffByType = async (req, res) => {
    console.log('[STAFFTYPE CONTROLLER] Ejecutando getStaffByType para tipo:', req.params.id);
    try {
        // Verificar que el tipo existe
        const staffType = await StaffType.findById(req.params.id);
        if (!staffType) {
            console.log('[STAFFTYPE CONTROLLER] Tipo de personal no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        const staffMembers = await Staff.find({ type: req.params.id })
            .populate('userId', 'username email role -_id')
            .populate('type', 'name -_id');

        res.status(200).json({
            success: true,
            data: {
                type: {
                    id: staffType._id,
                    name: staffType.name,
                    description: staffType.description
                },
                staff: staffMembers,
                count: staffMembers.length
            }
        });
    } catch (error) {
        console.error('[STAFFTYPE CONTROLLER] Error en getStaffByType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el personal por tipo'
        });
    }
};