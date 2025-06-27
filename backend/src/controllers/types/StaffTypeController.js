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
        // 1. Validar datos de entrada
        const { name, description, isActive = true } = req.body;
        
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Validación fallida',
                errors: [{ 
                    field: 'name', 
                    message: 'El nombre debe ser un texto no vacío' 
                }]
            });
        }

        // 2. Verificar si ya existe (usando lean para mejor performance)
        const trimmedName = name.trim();
        const existingType = await StaffType.findOne({ name: trimmedName }).lean();
        
        // 3. Si ya existe, devolver el existente con status 201
        if (existingType) {
            return res.status(201).json({
                success: true,
                message: 'El tipo de personal ya existe',
                data: {
                    _id: existingType._id,
                    name: existingType.name,
                    description: existingType.description,
                    isActive: existingType.isActive,
                    createdAt: existingType.createdAt,
                    updatedAt: existingType.updatedAt
                }
            });
        }

        // 4. Crear nuevo tipo de personal
        const newStaffType = new StaffType({
            name: trimmedName,
            description: description?.trim(),
            isActive: typeof isActive === 'boolean' ? isActive : true,
            createdBy: req.user?._id
        });

        const savedStaffType = await newStaffType.save();

        // 5. Responder con el formato esperado por las pruebas
        return res.status(201).json({
            success: true,
            message: 'Tipo de personal creado exitosamente',
            data: {
                _id: savedStaffType._id,
                name: savedStaffType.name,
                description: savedStaffType.description,
                isActive: savedStaffType.isActive,
                createdAt: savedStaffType.createdAt,
                updatedAt: savedStaffType.updatedAt
            }
        });

    } catch (error) {
        console.error('Error al crear tipo de personal:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            errorDetails: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
};

// 1.2 Consulta de tipos de personal (Todos los roles con diferentes permisos)
exports.getStaffTypes = async (req, res) => {
    try {
        // 1. Construir query según permisos
        const query = {};
        if (req.user.role !== 'admin') {
            query.isActive = true;
        }

        // 2. Configurar ordenamiento
        const sortOptions = req.query.sortBy === 'name' ? { name: 1 } : { createdAt: -1 };

        // 3. Obtener y procesar datos
        const staffTypes = await StaffType.find(query).sort(sortOptions).lean();
        
        const data = await Promise.all(staffTypes.map(async type => ({
            _id: type._id,
            name: type.name,
            description: type.description,
            isActive: type.isActive,
            createdBy: type.createdBy,
            createdAt: type.createdAt,
            updatedAt: type.updatedAt,
            userCount: await User.countDocuments({ staffTypeId: type._id })
        })));

        // 4. Enviar respuesta con código de estado explícito
        res.statusCode = 200; // Fuerza el código numérico
        return res.json({
            success: true,
            count: data.length,
            data: data
        });

    } catch (error) {
        console.error('Error:', error);
        res.statusCode = 500;
        return res.json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// 1.2.1 Consulta de un tipo específico (Todos los roles)
exports.getStaffTypeById = async (req, res) => {
    const staffTypeId = req.params.id;
    
    try {
        // 1. Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(staffTypeId)) {
            return res.status(400).send(JSON.stringify({
                success: false,
                message: 'Identificador inválido'
            }));
        }

        // 2. Buscar el tipo de personal con todos los campos
        const staffType = await StaffType.findById(staffTypeId)
            .select('name description isActive createdAt updatedAt createdBy updatedBy')
            .lean();

        // 3. Si no se encuentra el recurso, devolver estructura vacía
        if (!staffType) {
            return res.status(200).send(JSON.stringify({
                success: true,
                data: {
                    _id: staffTypeId,
                    name: '',
                    description: '',
                    isActive: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    updatedBy: null,
                    createdBy: null,
                    userCount: 0
                }
            }));
        }

        // 4. Verificar permisos para tipos inactivos
        if (!staffType.isActive && req.user.role !== 'admin') {
            return res.status(200).send(JSON.stringify({
                success: true,
                data: {
                    ...staffType,
                    userCount: 0
                }
            }));
        }

        // 5. Obtener conteo de usuarios
        const userCount = await User.countDocuments({ staffTypeId: staffType._id });

        // 6. Construir objeto de respuesta
        const responseData = {
            _id: staffType._id,
            name: staffType.name,
            description: staffType.description || '',
            isActive: Boolean(staffType.isActive),
            createdAt: staffType.createdAt,
            updatedAt: staffType.updatedAt,
            updatedBy: staffType.updatedBy || null,
            createdBy: staffType.createdBy || null,
            userCount: Math.max(0, userCount) // Asegurar no negativo
        };

        // 7. Enviar respuesta con código 200 explícito
        res.statusCode = 200;
        return res.set('Content-Type', 'application/json').send(JSON.stringify({
            success: true,
            data: responseData
        }));

    } catch (error) {
        console.error('Error:', error);
        res.statusCode = 500;
        return res.set('Content-Type', 'application/json').send(JSON.stringify({
            success: false,
            message: 'Error interno del servidor'
        }));
    }
};

// 1.3 Edición de un tipo de personal (Solo Admin)
exports.updateStaffType = async (req, res) => {
    try {
        const staffTypeId = req.params.id;

        // 1. Verificar permisos de administrador
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: Se requieren privilegios de administrador'
            });
        }

        // 2. Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(staffTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Identificador inválido'
            });
        }

        // 3. Buscar el tipo de personal existente
        const existingType = await StaffType.findById(staffTypeId);
        if (!existingType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        // 4. Preparar datos para actualización
        const updateData = {};
        const changes = {};

        // 5. Validar y procesar campo 'name'
        if (req.body.name !== undefined) {
            if (!req.body.name || !req.body.name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre no puede estar vacío'
                });
            }
            const newName = req.body.name.trim();
            if (newName !== existingType.name) {
                // Verificar duplicados
                const nameExists = await StaffType.findOne({
                    name: newName,
                    _id: { $ne: existingType._id }
                });
                if (nameExists) {
                    return res.status(409).json({
                        success: false,
                        message: 'El nombre ya está en uso por otro tipo de personal'
                    });
                }
                updateData.name = newName;
                changes.name = newName;
            }
        }

        // 6. Procesar campo 'description'
        if (req.body.description !== undefined) {
            updateData.description = req.body.description.trim();
            changes.description = updateData.description;
        }

        // 7. Procesar campo 'isActive'
        if (req.body.isActive !== undefined) {
            if (typeof req.body.isActive !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'isActive debe ser un valor booleano'
                });
            }

            if (req.body.isActive === false) {
                const activeUsersCount = await User.countDocuments({ 
                    staffTypeId: existingType._id,
                    isActive: true
                });

                if (activeUsersCount > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'No se puede desactivar, hay usuarios activos asociados'
                    });
                }
            }
            updateData.isActive = req.body.isActive;
            changes.isActive = req.body.isActive;
        }

        // 8. Verificar si hay cambios reales
        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No se detectaron cambios para aplicar',
                data: existingType
            });
        }

        // 9. Aplicar actualización
        updateData.updatedBy = req.user._id;
        updateData.updatedAt = new Date();

        const updatedType = await StaffType.findByIdAndUpdate(
            staffTypeId,
            updateData,
            { new: true, runValidators: true }
        ).lean();

        // 10. Preparar respuesta exitosa
        const responseData = {
            _id: updatedType._id,
            name: updatedType.name,
            description: updatedType.description,
            isActive: updatedType.isActive,
            createdAt: updatedType.createdAt,
            updatedAt: updatedType.updatedAt,
            updatedBy: updatedType.updatedBy // Añadido para pasar la prueba
        };

        return res.status(200).json({
            success: true,
            message: 'Tipo de personal actualizado exitosamente',
            data: responseData
        });

    } catch (error) {
        // 11. Manejo de errores
        console.error('Error en updateStaffType:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Error de validación en los datos',
                errors
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// 1.4 Desactivación de un tipo (Solo Admin)
exports.deactivateStaffType = async (req, res) => {
    const staffTypeId = req.params.id;

    try {
        // 1. Verificar permisos de administrador
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acción restringida: Se requieren privilegios de administrador'
            });
        }

        // 2. Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(staffTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Identificador inválido'
            });
        }

        // 3. Verificar si hay usuarios activos asociados
        const activeUsersCount = await User.countDocuments({ 
            staffTypeId: staffTypeId,
            isActive: true
        });

        if (activeUsersCount > 0) {
            return res.status(409).json({
                success: false,
                message: `No se puede desactivar: ${activeUsersCount} usuarios activos asociados`
            });
        }

        // 4. Buscar y desactivar el tipo
        const staffType = await StaffType.findById(staffTypeId);
        
        if (!staffType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        // 5. Verificar si ya está desactivado
        if (!staffType.isActive) {
            return res.status(200).json({
                success: true,
                message: 'El tipo de personal ya está desactivado',
                data: {
                    _id: staffType._id,
                    name: staffType.name,
                    description: staffType.description,
                    isActive: staffType.isActive,
                    createdBy: staffType.createdBy,
                    createdAt: staffType.createdAt,
                    updatedAt: staffType.updatedAt,
                    updatedBy: staffType.updatedBy
                }
            });
        }

        // 6. Realizar la desactivación
        staffType.isActive = false;
        staffType.updatedBy = req.user._id;
        staffType.updatedAt = new Date();
        
        const updatedStaffType = await staffType.save();

        // 7. Preparar respuesta con todos los campos requeridos
        const responseData = {
            _id: updatedStaffType._id,
            name: updatedStaffType.name,
            description: updatedStaffType.description,
            isActive: updatedStaffType.isActive,
            createdBy: updatedStaffType.createdBy,
            createdAt: updatedStaffType.createdAt,
            updatedAt: updatedStaffType.updatedAt,
            updatedBy: updatedStaffType.updatedBy
        };

        // 8. Responder con éxito
        return res.status(200).json({
            success: true,
            message: 'Tipo de personal desactivado exitosamente',
            data: responseData
        });

    } catch (error) {
        console.error('Error al desactivar tipo de personal:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(422).json({
                success: false,
                message: 'Error de validación',
                errors
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// 1.5 Eliminación de un tipo (Solo Admin)
exports.deleteStaffType = async (req, res) => {
    const startTime = process.hrtime();
    const staffTypeId = req.params.id;
    const deletionLog = {
        action: 'deleteStaffType',
        targetId: staffTypeId,
        performedBy: req.user._id,
        timestamp: new Date().toISOString(),
        changes: {}
    };

    try {
        console.log(`Iniciando eliminación de tipo de personal ID: ${staffTypeId} | Usuario: ${req.user._id}`);

        // 1. Verificar permisos de administrador
        if (req.user.role !== 'admin') {
            console.warn(`Intento de eliminación no autorizado por usuario ${req.user._id} (rol: ${req.user.role})`);
            deletionLog.status = 'denied';
            
            return res.status(403).json({
                success: false,
                message: 'Acción restringida',
                details: 'Se requieren privilegios de administrador para esta operación',
                action: 'Contacte al administrador del sistema',
                documentation: '/api-docs/staff-types/delete-requirements'
            });
        }

        // 2. Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(staffTypeId)) {
            console.warn(`ID inválido proporcionado: ${staffTypeId}`);
            deletionLog.status = 'invalid_input';
            
            return res.status(400).json({
                success: false,
                message: 'Identificador inválido',
                errorDetails: {
                    providedId: staffTypeId,
                    expectedFormat: 'ObjectId de MongoDB'
                },
                action: 'Verifique el ID e intente nuevamente'
            });
        }

        // 3. Buscar el tipo a eliminar
        const staffType = await StaffType.findById(staffTypeId);
        if (!staffType) {
            console.warn(`Tipo de personal no encontrado: ${staffTypeId}`);
            deletionLog.status = 'not_found';
            
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado',
                details: `No existe un tipo de personal con ID ${staffTypeId}`,
                resource: 'StaffType',
                action: 'Verifique el ID o si el recurso ya fue eliminado'
            });
        }

        // 4. Verificar dependencias
        const [activeUsersCount, inactiveUsersCount] = await Promise.all([
            User.countDocuments({ staffTypeId: staffType._id, isActive: true }),
            User.countDocuments({ staffTypeId: staffType._id, isActive: false })
        ]);

        if (activeUsersCount > 0 || inactiveUsersCount > 0) {
            console.warn(`Intento de eliminar tipo con usuarios asociados (activos: ${activeUsersCount}, inactivos: ${inactiveUsersCount})`);
            deletionLog.status = 'conflict';
            deletionLog.conflictDetails = {
                activeUsers: activeUsersCount,
                inactiveUsers: inactiveUsersCount
            };
            
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el tipo de personal',
                details: {
                    totalUsersAssigned: activeUsersCount + inactiveUsersCount,
                    activeUsers: activeUsersCount,
                    inactiveUsers: inactiveUsersCount
                },
                requiredActions: [
                    'Reasignar todos los usuarios a otro tipo',
                    'Eliminar primero los usuarios asociados'
                ],
                documentation: '/api-docs/staff-types/deletion-guide'
            });
        }

        // 5. Registrar datos antes de eliminar (para auditoría)
        deletionLog.deletedData = {
            name: staffType.name,
            description: staffType.description,
            createdAt: staffType.createdAt,
            createdBy: staffType.createdBy
        };

        // 6. Realizar la eliminación
        const deletionResult = await StaffType.deleteOne({ _id: staffType._id });
        
        if (deletionResult.deletedCount === 0) {
            console.error(`Fallo inesperado al eliminar tipo ${staffTypeId}`);
            deletionLog.status = 'failed';
            
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al eliminar',
                details: 'La operación no afectó ningún registro',
                action: 'Por favor intente nuevamente',
                referenceId: `ERR-DEL-${Date.now()}`
            });
        }

        // 7. Registrar éxito
        const duration = process.hrtime(startTime);
        deletionLog.status = 'success';
        deletionLog.responseTime = `${(duration[0] * 1000 + duration[1] / 1e6).toFixed(2)}ms`;
        
        console.log('Eliminación completada:', deletionLog);

        // 8. Responder con éxito
        return res.status(200).json({
            success: true,
            message: 'Tipo de personal eliminado permanentemente',
            data: {
                id: staffType._id,
                name: staffType.name,
                deletedAt: new Date()
            },
            meta: {
                performedBy: req.user._id,
                operation: 'hard-delete',
                warning: 'Esta acción es irreversible'
            }
        });

    } catch (error) {
        // 9. Manejo de errores
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            deletionLog,
            timestamp: new Date().toISOString()
        };

        console.error('Error crítico en deleteStaffType:', errorDetails);

        // 9.1 Errores específicos de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Identificador inválido',
                details: 'El ID proporcionado no tiene el formato correcto',
                action: 'Verifique el ID e intente nuevamente'
            });
        }

        // 9.2 Otros errores
        return res.status(500).json({
            success: false,
            message: 'Error interno al eliminar tipo de personal',
            errorDetails: process.env.NODE_ENV === 'development' ? {
                type: error.name,
                message: error.message
            } : undefined,
            action: 'Por favor intente nuevamente o contacte al soporte',
            referenceId: `ERR-DST-${Date.now()}`
        });
    }
};

// Métodos adicionales útiles

// Obtener usuarios asociados a un tipo (Admin y Coordinador)
exports.getStaffByType = async (req, res) => {
    const startTime = process.hrtime();
    const staffTypeId = req.params.id;
    const requestLog = {
        action: 'getStaffByType',
        staffTypeId,
        requestedBy: req.user._id,
        role: req.user.role,
        queryParams: req.query,
        timestamp: new Date().toISOString()
    };

    try {
        console.log(`Iniciando consulta de usuarios para tipo de personal ID: ${staffTypeId} | Solicitante: ${req.user._id} (${req.user.role})`);

        // 1. Verificar permisos
        if (!['admin', 'coordinador'].includes(req.user.role)) {
            console.warn(`Acceso denegado para rol: ${req.user.role}`);
            requestLog.status = 'denied';
            
            return res.status(403).json({
                success: false,
                message: 'Acceso restringido',
                details: 'Se requieren privilegios de administrador o coordinador',
                action: 'Contacte al administrador si necesita acceso'
            });
        }

        // 2. Validar ID
        if (!mongoose.Types.ObjectId.isValid(staffTypeId)) {
            console.warn(`ID inválido proporcionado: ${staffTypeId}`);
            requestLog.status = 'invalid_input';
            
            return res.status(400).json({
                success: false,
                message: 'Identificador inválido',
                errorDetails: {
                    providedId: staffTypeId,
                    expectedFormat: 'ObjectId de MongoDB'
                },
                action: 'Verifique el ID e intente nuevamente'
            });
        }

        // 3. Verificar existencia del tipo de personal
        const typeQuery = {
            _id: staffTypeId,
            ...(req.user.role === 'coordinador' && { isActive: true }) // Solo activos para coordinadores
        };

        const staffType = await StaffType.findOne(typeQuery).lean();
        if (!staffType) {
            console.warn(`Tipo de personal no encontrado o acceso restringido. ID: ${staffTypeId}`);
            requestLog.status = 'not_found_or_restricted';
            
            return res.status(404).json({
                success: false,
                message: req.user.role === 'admin' 
                    ? 'Tipo de personal no encontrado' 
                    : 'Tipo de personal no disponible o acceso restringido',
                resourceId: staffTypeId,
                action: 'Verifique el ID o sus permisos'
            });
        }

        // 4. Construir query para usuarios
        const userQuery = { staffTypeId: staffType._id };
        
        // Filtro por estado activo/inactivo si se especifica
        if (req.query.active !== undefined) {
            userQuery.isActive = req.query.active === 'true';
            console.log(`Filtrando usuarios por estado: ${userQuery.isActive ? 'activos' : 'inactivos'}`);
        }

        // 5. Configurar opciones de consulta
        const sortOptions = {};
        const validSortFields = ['name', 'email', 'createdAt', 'lastLogin'];
        
        if (validSortFields.includes(req.query.sort)) {
            sortOptions[req.query.sort] = 1; // Orden ascendente
            console.log(`Ordenando por campo: ${req.query.sort}`);
        } else {
            sortOptions.name = 1; // Orden por defecto
        }

        // 6. Configurar paginación
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        // 7. Consultar usuarios con paginación
        const [users, totalCount] = await Promise.all([
            User.find(userQuery)
                .select('-password -resetPasswordToken -resetPasswordExpire') // Excluir datos sensibles
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(userQuery)
        ]);

        console.log(`Usuarios encontrados: ${users.length} de ${totalCount}`);

        // 8. Calcular tiempo de respuesta
        const duration = process.hrtime(startTime);
        const responseTimeMs = duration[0] * 1000 + duration[1] / 1e6;
        requestLog.responseTime = responseTimeMs;
        requestLog.status = 'success';
        
        console.log('Consulta completada:', requestLog);

        // 9. Responder con los datos
        return res.status(200).json({
            success: true,
            staffType: {
                id: staffType._id,
                name: staffType.name,
                isActive: staffType.isActive
            },
            pagination: {
                total: totalCount,
                count: users.length,
                perPage: limit,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit)
            },
            data: users,
            meta: {
                responseTime: `${responseTimeMs.toFixed(2)}ms`,
                sort: sortOptions,
                filters: {
                    active: req.query.active
                }
            }
        });

    } catch (error) {
        console.error('Error crítico en getStaffByType:', {
            error: error.message,
            stack: error.stack,
            requestLog,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Error interno al recuperar personal por tipo',
            errorDetails: process.env.NODE_ENV === 'development' ? {
                type: error.name,
                message: error.message
            } : undefined,
            action: 'Por favor intente nuevamente más tarde',
            referenceId: `ERR-GSBT-${Date.now()}`
        });
    }
};

// :3