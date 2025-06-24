const mongoose = require('mongoose');
const StaffType = require('../../models/types/StaffType');
const User = require('../../models/core/User');

/**
 * Controlador para la gestión de Tipos de Personal
 * - Acciones CRUD para administradores
 * - Acciones de solo lectura para coordinadores y líderes
 */
 
// 1.1 Creación de un nuevo tipo de personal (Solo Admin)
exports.createStaffType = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Requiere rol de administrador'
            });
        }

        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es obligatorio',
                field: 'name'
            });
        }

        const existingType = await StaffType.findOne({ name: name.trim() });
        if (existingType) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un tipo con este nombre',
                conflictId: existingType._id
            });
        }

        const newStaffType = new StaffType({
            name: name.trim(),
            description: description?.trim(),
            createdBy: req.user._id
        });

        const savedStaffType = await newStaffType.save();
        
        return res.status(201).json({
            success: true,
            message: 'Tipo de personal creado exitosamente',
            data: savedStaffType
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno al crear tipo de personal',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 1.2 Consulta de tipos de personal (Todos los roles con diferentes permisos)
exports.getStaffTypes = async (req, res) => {
    try {
        console.log('Consultando StaffTypes - Usuario:', req.user?._id);
        
        // Construir query según el rol del usuario
        let query = {};
        
        // Solo admin puede ver tipos inactivos
        if (req.user.role !== 'admin') {
            query.isActive = true;
            console.log('Filtrando solo tipos activos para rol:', req.user.role);
        }

        // Opciones de ordenamiento
        const sortOptions = {};
        if (req.query.sortBy === 'name') {
            sortOptions.name = 1; // Orden alfabético ascendente
        } else {
            sortOptions.createdAt = -1; // Orden por fecha de creación (más reciente primero)
        }

        // Consulta a la base de datos
        const staffTypes = await StaffType.find(query)
            .sort(sortOptions)
            .lean(); // Usar lean() para mejor performance en consultas de solo lectura

        console.log(`StaffTypes encontrados: ${staffTypes.length}`);

        // Para admin, agregar conteo de usuarios asociados
        if (req.user.role === 'admin') {
            const typesWithCount = await Promise.all(
                staffTypes.map(async type => {
                    const userCount = await User.countDocuments({ staffTypeId: type._id });
                    return { ...type, userCount };
                })
            );
            
            return res.status(200).json({
                success: true,
                count: typesWithCount.length,
                data: typesWithCount
            });
        }

        res.status(200).json({
            success: true,
            count: staffTypes.length,
            data: staffTypes
        });

    } catch (error) {
        console.error('Error en getStaffTypes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tipos de personal',
            error: error.message
        });
    }
};

// 1.2.1 Consulta de un tipo específico (Todos los roles)
exports.getStaffTypeById = async (req, res) => {
    try {
        console.log(`Consultando StaffType ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn('ID inválido proporcionado');
            return res.status(400).json({
                success: false,
                message: 'ID de tipo de personal inválido'
            });
        }

        // Construir query según el rol
        let query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.isActive = true;
        }

        const staffType = await StaffType.findOne(query);

        if (!staffType) {
            console.warn('StaffType no encontrado o no accesible');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado o no tienes acceso'
            });
        }

        // Para admin, agregar información adicional
        let responseData = staffType.toObject();
        if (req.user.role === 'admin') {
            const userCount = await User.countDocuments({ staffTypeId: staffType._id });
            responseData.userCount = userCount;
            console.log(`Usuarios asociados: ${userCount}`);
        }

        res.status(200).json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Error en getStaffTypeById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tipo de personal',
            error: error.message
        });
    }
};

// 1.3 Edición de un tipo de personal (Solo Admin)
exports.updateStaffType = async (req, res) => {
    try {
        // Verificar permisos de administrador
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción'
            });
        }

        // Validar ID del tipo de personal
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de tipo de personal inválido'
            });
        }

        // Buscar el tipo de personal existente
        const existingType = await StaffType.findById(req.params.id);
        if (!existingType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        // Preparar datos para actualización
        const updateData = {
            updatedBy: req.user._id
        };

        // Actualizar isActive si viene en el request
        if (req.body.isActive !== undefined) {
            updateData.isActive = req.body.isActive;
        }

        // Validar y actualizar nombre si es diferente
        if (req.body.name && req.body.name.trim() !== existingType.name) {
            // Verificar contra enum si existe
            if (StaffType.schema.path('name').enumValues) {
                const validTypes = StaffType.schema.path('name').enumValues;
                if (!validTypes.includes(req.body.name.trim())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nombre no válido',
                        validTypes
                    });
                }
            }

            // Verificar que no exista otro tipo con el mismo nombre
            const nameExists = await StaffType.findOne({
                name: req.body.name.trim(),
                _id: { $ne: existingType._id }
            });
            
            if (nameExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe otro tipo de personal con ese nombre'
                });
            }
            
            updateData.name = req.body.name.trim();
        }

        // Actualizar descripción si viene en el request
        if (req.body.description !== undefined) {
            updateData.description = req.body.description.trim();
        }

        // Realizar la actualización en la base de datos
        const updatedType = await StaffType.findByIdAndUpdate(
            req.params.id,
            updateData,
            { 
                new: true,       // Devuelve el documento actualizado
                runValidators: true  // Ejecuta validaciones del schema
            }
        );

        // Respuesta exitosa
        return res.status(200).json({
            success: true,
            message: 'Tipo de personal actualizado exitosamente',
            data: updatedType
        });

    } catch (error) {
        // Manejo de errores de validación
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors
            });
        }

        // Manejo de otros errores
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar tipo de personal',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 1.4 Desactivación de un tipo (Solo Admin)
exports.deactivateStaffType = async (req, res) => {
    try {
        console.log(`Desactivando StaffType ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
        // Verificar rol de administrador
        if (req.user.role !== 'admin') {
            console.warn('Intento de desactivación por usuario no autorizado');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción'
            });
        }

        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn('ID inválido proporcionado');
            return res.status(400).json({
                success: false,
                message: 'ID de tipo de personal inválido'
            });
        }

        // Buscar y actualizar
        const staffType = await StaffType.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true, runValidators: true }
        );

        if (!staffType) {
            console.warn('StaffType no encontrado para desactivar');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        console.log('StaffType desactivado exitosamente:', staffType._id);
        res.status(200).json({
            success: true,
            message: 'Tipo de personal desactivado exitosamente',
            data: staffType
        });

    } catch (error) {
        console.error('Error en deactivateStaffType:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar tipo de personal',
            error: error.message
        });
    }
};

// 1.5 Eliminación de un tipo (Solo Admin)
exports.deleteStaffType = async (req, res) => {
    try {
        console.log(`Eliminando StaffType ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
        // Verificar rol de administrador
        if (req.user.role !== 'admin') {
            console.warn('Intento de eliminación por usuario no autorizado');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción'
            });
        }

        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn('ID inválido proporcionado');
            return res.status(400).json({
                success: false,
                message: 'ID de tipo de personal inválido'
            });
        }

        // Buscar el tipo
        const staffType = await StaffType.findById(req.params.id);
        if (!staffType) {
            console.warn('StaffType no encontrado para eliminar');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        // Verificar si hay usuarios asociados
        const usersWithType = await User.countDocuments({ staffTypeId: staffType._id });
        if (usersWithType > 0) {
            console.warn('Intento de eliminar tipo con usuarios asociados:', usersWithType);
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar: hay personal asignado a esta categoría',
                userCount: usersWithType
            });
        }

        // Eliminar el tipo - USANDO EL MÉTODO ACTUALIZADO
        await StaffType.deleteOne({ _id: staffType._id });
        console.log('StaffType eliminado exitosamente:', staffType._id);

        res.status(200).json({
            success: true,
            message: 'Tipo de personal eliminado exitosamente',
            data: { 
                _id: staffType._id, 
                name: staffType.name,
                deletedAt: new Date() 
            }
        });

    } catch (error) {
        console.error('Error en deleteStaffType:', error);
        
        // Manejo específico de errores de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de tipo de personal inválido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar tipo de personal',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Métodos adicionales útiles

// Obtener usuarios asociados a un tipo (Admin y Coordinador)
exports.getStaffByType = async (req, res) => {
    try {
        console.log(`Consultando usuarios para StaffType ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
        // Verificar permisos (Admin o Coordinador)
        if (!['admin', 'coordinador'].includes(req.user.role)) {
            console.warn('Intento de acceso no autorizado');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción'
            });
        }

        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn('ID inválido proporcionado');
            return res.status(400).json({
                success: false,
                message: 'ID de tipo de personal inválido'
            });
        }

        // Verificar si el tipo existe y está activo (para coordinador)
        let query = { _id: req.params.id };
        if (req.user.role === 'coordinador') {
            query.isActive = true;
        }

        const staffType = await StaffType.findOne(query);
        if (!staffType) {
            console.warn('StaffType no encontrado o no accesible');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado o no tienes acceso'
            });
        }

        // Consultar usuarios asociados
        const users = await User.find({ staffTypeId: staffType._id })
            .select('-password') // Excluir información sensible
            .lean();

        console.log(`Usuarios encontrados para este tipo: ${users.length}`);

        res.status(200).json({
            success: true,
            staffType: staffType.name,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('Error en getStaffByType:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener personal por tipo',
            error: error.message
        });
    }
};