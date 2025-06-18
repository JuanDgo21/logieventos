// backend/controllers/types/StaffTypeController.js
const StaffType = require('../../src/models/types/StaffType');

/**
 * @desc    Obtener todos los tipos de personal
 * @route   GET /api/staff-types
 * @access  Private/Admin
 */
exports.getStaffTypes = async (req, res) => {
    try {
        console.log('Obteniendo todos los tipos de personal');
        const staffTypes = await StaffType.find().sort({ nombre: 1 });

        res.status(200).json({
            success: true,
            count: staffTypes.length,
            data: staffTypes
        });
    } catch (error) {
        console.error('Error en getStaffTypes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tipos de personal'
        });
    }
};

/**
 * @desc    Crear un nuevo tipo de personal
 * @route   POST /api/staff-types
 * @access  Private/Admin
 */
exports.createStaffType = async (req, res) => {
    try {
        console.log('Intentando crear nuevo tipo de personal:', req.body);
        const { nombre, descripcion, roles, icono } = req.body;

        // Validación de campos requeridos
        if (!nombre || !descripcion || !roles || !Array.isArray(roles) || roles.length === 0) {
            console.log('Validación fallida: campos requeridos faltantes');
            return res.status(400).json({
                success: false,
                message: 'Nombre, descripción y al menos un rol son requeridos'
            });
        }

        // Validar que los roles tengan nombre
        const invalidRoles = roles.some(role => !role.nombre);
        if (invalidRoles) {
            console.log('Validación fallida: roles sin nombre');
            return res.status(400).json({
                success: false,
                message: 'Todos los roles deben tener un nombre'
            });
        }

        // Crear el nuevo tipo
        const newStaffType = new StaffType({
            nombre,
            descripcion,
            roles,
            icono: icono || '👔'
        });

        // Guardar en la base de datos
        const savedStaffType = await newStaffType.save();
        console.log(`Tipo de personal creado exitosamente: ${savedStaffType._id}`);

        res.status(201).json({
            success: true,
            message: 'Tipo de personal creado exitosamente',
            data: savedStaffType
        });

    } catch (error) {
        console.error('Error en createStaffType:', error);
        
        // Manejo de errores específicos
        if (error.message.includes('duplicados')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear tipo de personal'
        });
    }
};

/**
 * @desc    Obtener un tipo de personal por ID
 * @route   GET /api/staff-types/:id
 * @access  Private/Admin
 */
exports.getStaffTypeById = async (req, res) => {
    try {
        console.log(`Buscando tipo de personal con ID: ${req.params.id}`);
        const staffType = await StaffType.findById(req.params.id);

        if (!staffType) {
            console.log(`Tipo de personal no encontrado para ID: ${req.params.id}`);
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
        console.error('Error en getStaffTypeById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tipo de personal'
        });
    }
};

/**
 * @desc    Actualizar un tipo de personal
 * @route   PUT /api/staff-types/:id
 * @access  Private/Admin
 */
exports.updateStaffType = async (req, res) => {
    try {
        console.log(`Actualizando tipo de personal con ID: ${req.params.id}`, req.body);
        const { nombre, descripcion, roles, icono } = req.body;
        const updateData = {};

        // Preparar datos para actualización
        if (nombre !== undefined) updateData.nombre = nombre;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (icono !== undefined) updateData.icono = icono;
        
        // Manejo especial para roles (solo si se proporcionan)
        if (roles !== undefined) {
            if (!Array.isArray(roles) || roles.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar al menos un rol válido'
                });
            }
            updateData.roles = roles;
        }

        const updatedStaffType = await StaffType.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedStaffType) {
            console.log(`Tipo de personal no encontrado para ID: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        console.log(`Tipo de personal actualizado exitosamente: ${req.params.id}`);
        res.status(200).json({
            success: true,
            message: 'Tipo de personal actualizado exitosamente',
            data: updatedStaffType
        });
    } catch (error) {
        console.error('Error en updateStaffType:', error);
        
        if (error.message.includes('duplicados')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar tipo de personal'
        });
    }
};

/**
 * @desc    Eliminar un tipo de personal
 * @route   DELETE /api/staff-types/:id
 * @access  Private/Admin
 */
exports.deleteStaffType = async (req, res) => {
    try {
        console.log(`Eliminando tipo de personal con ID: ${req.params.id}`);
        const deletedStaffType = await StaffType.findByIdAndDelete(req.params.id);

        if (!deletedStaffType) {
            console.log(`Tipo de personal no encontrado para ID: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        console.log(`Tipo de personal eliminado exitosamente: ${req.params.id}`);
        res.status(200).json({
            success: true,
            message: 'Tipo de personal eliminado exitosamente',
            data: deletedStaffType
        });
    } catch (error) {
        console.error('Error en deleteStaffType:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar tipo de personal'
        });
    }
};

/**
 * @desc    Agregar un rol a un tipo de personal existente
 * @route   POST /api/staff-types/:id/roles
 * @access  Private/Admin
 */
exports.addRoleToStaffType = async (req, res) => {
    try {
        console.log(`Agregando rol a tipo de personal con ID: ${req.params.id}`, req.body);
        const { nombre, descripcion, requiereCertificacion } = req.body;

        // Validación
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del rol es requerido'
            });
        }

        const staffType = await StaffType.findById(req.params.id);
        if (!staffType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        // Usar el método personalizado del modelo
        const newRole = {
            nombre,
            descripcion: descripcion || '',
            requiereCertificacion: requiereCertificacion || false
        };

        await staffType.agregarRol(newRole);
        
        console.log(`Rol agregado exitosamente a tipo de personal: ${req.params.id}`);
        res.status(200).json({
            success: true,
            message: 'Rol agregado exitosamente',
            data: staffType
        });
    } catch (error) {
        console.error('Error en addRoleToStaffType:', error);
        
        if (error.message.includes('duplicados')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al agregar rol'
        });
    }
};