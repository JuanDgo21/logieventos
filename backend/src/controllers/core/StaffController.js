const Staff = require('../../models/core/Staff');
const User = require('../../models/core/User');
const Event = require('../../models/core/Event');
const StaffType = require('../../models/types/StaffType');
const mongoose = require('mongoose');

/**
 * Controlador para la gestión de Personal (Staff)
 * - Acciones CRUD completas para administradores
 * - Acciones limitadas para coordinadores
 * - Acciones de solo lectura para líderes
 */

// ----------------------------
// 2.1 Registro de nuevo personal
// ----------------------------
 
/**
 * Crear un nuevo miembro del personal
 * Roles permitidos: admin, coordinador
 */
exports.createStaff = async (req, res) => {
    try {
        // 1. Verificar permisos
        if (!req.user || !['admin', 'coordinador'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Se requieren privilegios de administrador o coordinador'
            });
        }

        // 2. Validar campos requeridos
        const { identification, name, phone, emergencyContact, staffTypeId, asistencia = false } = req.body;
        
        if (!identification || !name || !phone || !staffTypeId) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }

        // 3. Validar formato de teléfono
        if (!/^\+?\d{7,15}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de teléfono inválido',
                field: 'phone'
            });
        }

        // 4. Validar emergencyContact
        if (emergencyContact && emergencyContact.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El contacto de emergencia no puede estar vacío',
                field: 'emergencyContact'
            });
        }

        // 5. Verificar si ya existe (case-insensitive y trimmed)
        const existingStaff = await Staff.findOne({ 
            identification: { $regex: new RegExp(`^${identification.trim()}$`, 'i') }
        }).populate('staffType');

        if (existingStaff) {
            // Si existe, retornar los datos del existente
            return res.status(201).json({
                success: true,
                message: 'Personal ya existente',
                data: {
                    _id: existingStaff._id,
                    id: existingStaff._id.toString(),
                    identification: existingStaff.identification,
                    name: existingStaff.name,
                    phone: existingStaff.phone,
                    emergencyContact: existingStaff.emergencyContact || '',
                    staffTypeId: existingStaff.staffTypeId,
                    staffType: existingStaff.staffType ? {
                        _id: existingStaff.staffType._id,
                        name: existingStaff.staffType.name,
                        description: existingStaff.staffType.description || '',
                        isActive: existingStaff.staffType.isActive
                    } : null,
                    asistencia: existingStaff.asistencia,
                    createdAt: existingStaff.createdAt
                }
            });
        }

        // 6. Verificar tipo de personal
        const staffType = await StaffType.findById(staffTypeId);
        if (!staffType) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }

        // Verificar si el tipo de personal está activo
        if (!staffType.isActive) {
            return res.status(400).json({
                success: false,
                message: 'No se puede asignar un tipo de personal inactivo',
                field: 'staffTypeId'
            });
        }

        // 7. Crear nuevo staff (solo si no existe)
        const newStaff = new Staff({
            identification: identification.trim(),
            name: name.trim(),
            phone: phone.trim(),
            emergencyContact: emergencyContact?.trim(),
            staffTypeId,
            asistencia,
            createdBy: req.user._id
        });

        const savedStaff = await newStaff.save();

        // 8. Preparar respuesta
        const responseData = {
            _id: savedStaff._id,
            id: savedStaff._id.toString(),
            identification: savedStaff.identification,
            name: savedStaff.name,
            phone: savedStaff.phone,
            emergencyContact: savedStaff.emergencyContact || '',
            staffTypeId: savedStaff.staffTypeId,
            staffType: {
                _id: staffType._id,
                name: staffType.name,
                description: staffType.description || '',
                isActive: staffType.isActive
            },
            asistencia: savedStaff.asistencia,
            createdAt: savedStaff.createdAt
        };

        return res.status(201).json({
            success: true,
            message: 'Personal creado exitosamente',
            data: responseData
        });

    } catch (error) {
        console.error('Error en createStaff:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(422).json({
                success: false,
                message: 'Errores de validación',
                errors
            });
        }

        if (error.code === 11000) {
            // Si ocurre un error de duplicado (aunque debería haberse capturado antes)
            const existing = await Staff.findOne({ identification: req.body.identification })
                .populate('staffType');
                
            return res.status(201).json({
                success: true,
                message: 'Personal ya existente',
                data: {
                    _id: existing._id,
                    id: existing._id.toString(),
                    identification: existing.identification,
                    name: existing.name,
                    phone: existing.phone,
                    emergencyContact: existing.emergencyContact || '',
                    staffTypeId: existing.staffTypeId,
                    staffType: existing.staffType ? {
                        _id: existing.staffType._id,
                        name: existing.staffType.name,
                        description: existing.staffType.description || '',
                        isActive: existing.staffType.isActive
                    } : null,
                    asistencia: existing.asistencia,
                    createdAt: existing.createdAt
                }
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ---------------------------- 
// 2.2 Consulta de personal
// ----------------------------

/**
 * Obtener todos los miembros del personal con filtros
 * Roles permitidos: admin, coordinador, lider (con restricciones)
 */
exports.getAllStaff = async (req, res) => {
    const startTime = Date.now();
    
    try {
        // 1. Verificar autenticación y autorización
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const allowedRoles = ['admin', 'coordinador', 'lider'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        // 2. Construir query base
        let query = {};
        
        // Filtro para coordinadores
        if (req.user.role === 'coordinador') {
            const activeStaffTypes = await StaffType.find({ isActive: true }, '_id');
            query.staffTypeId = { $in: activeStaffTypes.map(st => st._id) };
        }

        // 3. Aplicar filtros adicionales
        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: 'i' };
        }

        if (req.query.identification) {
            query.identification = { $regex: req.query.identification, $options: 'i' };
        }

        if (req.query.staffTypeId && mongoose.Types.ObjectId.isValid(req.query.staffTypeId)) {
            query.staffTypeId = req.query.staffTypeId;
        }

        if (req.query.asistencia !== undefined) {
            query.asistencia = req.query.asistencia === 'true';
        }

        // 4. Configurar paginación
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;

        // 5. Configurar ordenamiento
        const sortOptions = req.query.sortBy ? 
            { [req.query.sortBy.replace('-', '')]: req.query.sortBy.startsWith('-') ? -1 : 1 } 
            : { name: 1 };

        // 6. Consulta a la base de datos con estructura completa
        const [staff, total] = await Promise.all([
            Staff.find(query)
                .populate({
                    path: 'staffType',
                    select: '_id name description isActive createdAt updatedAt'
                })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            Staff.countDocuments(query)
        ]);

        // 7. Formatear respuesta según requerimientos de las pruebas
        const formattedStaff = staff.map(item => ({
            _id: item._id,
            id: item._id.toString(),
            identification: item.identification,
            name: item.name,
            phone: item.phone || '',
            emergencyContact: item.emergencyContact || '',
            staffTypeId: item.staffTypeId,
            staffType: item.staffType ? {
                _id: item.staffType._id,
                name: item.staffType.name,
                description: item.staffType.description || '',
                isActive: item.staffType.isActive,
                createdAt: item.staffType.createdAt,
                updatedAt: item.staffType.updatedAt
            } : null,
            asistencia: item.asistencia || false,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));

        // 8. Enviar respuesta estructurada
        res.status(200).json({
            success: true,
            count: staff.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: formattedStaff
        });

    } catch (error) {
        console.error('Error in getAllStaff:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
 
/**
 * Obtener un miembro del personal por ID
 * Roles permitidos: admin, coordinador, lider (con restricciones)
 */
exports.getStaffById = async (req, res) => {
    const startTime = Date.now();
    const staffId = req.params.id;
    
    try {
        console.log(`[Staff Controller] Consultando Staff ID: ${staffId} - Usuario: ${req.user?._id} Rol: ${req.user?.role}`);
        
        // 1. Verificar autenticación
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado: Debe iniciar sesión primero'
            });
        }

        // 2. Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de ID no válido',
                field: 'id'
            });
        }

        // 3. Verificar autorización según rol
        const allowedRoles = ['admin', 'coordinador', 'lider'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a esta información'
            });
        }

        // 4. Construir query base
        const query = { _id: staffId };

        // 5. Lógica específica por rol
        let staff;
        
        if (req.user.role === 'admin') {
            staff = await Staff.findOne(query)
                .populate('staffType', 'name description isActive');
        }
        else if (req.user.role === 'coordinador') {
            staff = await Staff.findOne(query)
                .populate({
                    path: 'staffType',
                    match: { isActive: true },
                    select: 'name description isActive'
                });

            if (!staff || !staff.staffType) {
                return res.status(404).json({
                    success: false,
                    message: 'Personal no encontrado o no disponible'
                });
            }
        }
        else if (req.user.role === 'lider') {
            const isAssigned = await Event.exists({
                'assignedStaff.staffId': staffId,
                'leaderId': req.user._id
            });

            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo puedes ver personal asignado a tus eventos'
                });
            }

            staff = await Staff.findOne(query)
                .populate('staffType', 'name description');
        }

        // 6. Verificar si se encontró el staff
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        // 7. Formatear respuesta según requerimientos
        const staffData = {
            _id: staff._id,
            id: staff._id.toString(),
            identification: staff.identification,
            name: staff.name,
            phone: staff.phone || '',
            emergencyContact: staff.emergencyContact || '',
            staffTypeId: staff.staffTypeId,
            staffType: staff.staffType ? {
                _id: staff.staffType._id,
                name: staff.staffType.name,
                description: staff.staffType.description || '',
                isActive: staff.staffType.isActive
            } : null,
            asistencia: staff.asistencia || false,
            createdAt: staff.createdAt,
            updatedAt: staff.updatedAt
        };

        // 8. Responder con éxito
        const executionTime = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Miembro del personal obtenido exitosamente',
            data: staffData
        });

    } catch (error) {
        console.error('[Staff Controller] Error en getStaffById:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido',
                field: 'id'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno al obtener miembro del personal'
        });
    }
};

// ----------------------------
// 2.3 Edición de personal
// ----------------------------

/**
 * Actualizar un miembro del personal
 * Roles permitidos: admin, coordinador
 */
exports.updateStaff = async (req, res) => {
    const startTime = Date.now();
    const staffId = req.params.id;
    
    try {
        // 1. Verificar autenticación y permisos
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado: Debe iniciar sesión primero'
            });
        }

        if (!['admin', 'coordinador'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: Requiere rol admin o coordinador'
            });
        }

        // 2. Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de ID no válido',
                field: 'id'
            });
        }

        // 3. Buscar el staff existente
        const existingStaff = await Staff.findById(staffId);
        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado',
                data: null
            });
        }

        // 4. Validar y preparar datos de actualización
        const { staffTypeId, name, phone, emergencyContact, asistencia } = req.body;
        const updateData = {};
        const validationErrors = [];

        // Validación de staffTypeId
        if (staffTypeId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(staffTypeId)) {
                validationErrors.push({
                    field: 'staffTypeId',
                    message: 'Formato de ID de tipo de personal no válido'
                });
            } else {
                // Restricción para coordinadores
                if (req.user.role === 'coordinador' && staffTypeId !== existingStaff.staffTypeId.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para cambiar el tipo de personal'
                    });
                }

                const staffType = await StaffType.findById(staffTypeId);
                if (!staffType) {
                    validationErrors.push({
                        field: 'staffTypeId',
                        message: 'Tipo de personal no encontrado'
                    });
                } else if (req.user.role === 'coordinador' && !staffType.isActive) {
                    validationErrors.push({
                        field: 'staffTypeId',
                        message: 'No se puede asignar un tipo de personal inactivo'
                    });
                } else {
                    updateData.staffTypeId = staffTypeId;
                }
            }
        }

        // Validación de nombre
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length < 2) {
                validationErrors.push({
                    field: 'name',
                    message: 'El nombre debe tener al menos 2 caracteres'
                });
            } else {
                updateData.name = name.trim();
            }
        }

        // Validación de teléfono
        if (phone !== undefined) {
            const phoneRegex = /^\+?\d{7,15}$/;
            if (!phoneRegex.test(phone)) {
                validationErrors.push({
                    field: 'phone',
                    message: 'Formato de teléfono inválido. Ejemplo válido: +584125554433'
                });
            } else {
                updateData.phone = phone.trim();
            }
        }

        // Validación de contacto de emergencia
        if (emergencyContact !== undefined) {
            if (emergencyContact && typeof emergencyContact !== 'string') {
                validationErrors.push({
                    field: 'emergencyContact',
                    message: 'Formato de contacto de emergencia inválido'
                });
            } else {
                updateData.emergencyContact = emergencyContact?.trim();
            }
        }

        // Validación de asistencia
        if (asistencia !== undefined) {
            if (typeof asistencia !== 'boolean') {
                validationErrors.push({
                    field: 'asistencia',
                    message: 'El campo asistencia debe ser true o false'
                });
            } else {
                updateData.asistencia = asistencia;
            }
        }

        // Verificar si hay errores de validación
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación en los datos',
                errors: validationErrors
            });
        }

        // 5. Aplicar actualización
        Object.assign(existingStaff, updateData);
        existingStaff.updatedAt = new Date();
        existingStaff.updatedBy = req.user._id;

        const updatedStaff = await existingStaff.save();

        // 6. Obtener datos completos para la respuesta
        const staffType = await StaffType.findById(updatedStaff.staffTypeId);
        
        const responseData = {
            _id: updatedStaff._id,
            id: updatedStaff._id.toString(),
            identification: updatedStaff.identification,
            name: updatedStaff.name,
            phone: updatedStaff.phone,
            emergencyContact: updatedStaff.emergencyContact || '',
            staffTypeId: updatedStaff.staffTypeId,
            staffType: {
                _id: staffType._id,
                name: staffType.name,
                description: staffType.description || '',
                isActive: staffType.isActive
            },
            asistencia: updatedStaff.asistencia,
            createdAt: updatedStaff.createdAt,
            updatedAt: updatedStaff.updatedAt
        };

        // 7. Responder con éxito
        const executionTime = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Miembro del personal actualizado exitosamente',
            data: responseData
        });

    } catch (error) {
        console.error('Error en updateStaff:', error);

        // Manejo de errores de validación
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(422).json({
                success: false,
                message: 'Errores de validación en los datos',
                errors
            });
        }

        // Manejo de errores de casteo
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID proporcionado no válido',
                field: error.path
            });
        }

        // Manejo de errores de duplicados
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Conflicto: El valor ya existe en la base de datos',
                field: 'identification'
            });
        }

        // Error genérico del servidor
        return res.status(500).json({
            success: false,
            message: 'Error interno al actualizar miembro del personal'
        });
    }
}; 

// ----------------------------
// 2.4 Control de asistencia
// ----------------------------

/**
 * Actualizar el estado de asistencia de un miembro del personal
 * Roles permitidos: admin, coordinador
 */
exports.updateAttendance = async (req, res) => {
    const startTime = Date.now();
    const staffId = req.params.id;
    
    try {
        console.log(`[Staff Controller] Actualizando asistencia - Staff ID: ${staffId} - Usuario: ${req.user?._id}`);
        
        // 1. Verificar autenticación y permisos
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado: Debe iniciar sesión primero'
            });
        }

        const allowedRoles = ['admin', 'coordinador'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: Requiere rol admin o coordinador'
            });
        }

        // 2. Validar ID
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de ID no válido',
                field: 'id'
            });
        }

        // 3. Validar campo asistencia
        const { asistencia } = req.body;
        
        if (asistencia === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El campo "asistencia" es requerido',
                field: 'asistencia'
            });
        }

        if (typeof asistencia !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'El campo "asistencia" debe ser true o false',
                field: 'asistencia'
            });
        }

        // 4. Actualizar asistencia
        const updatedStaff = await Staff.findByIdAndUpdate(
            staffId,
            {
                asistencia,
                updatedAt: new Date(),
                updatedBy: req.user._id
            },
            { 
                new: true,
                runValidators: true
            }
        ).populate('staffType', 'name description isActive');

        if (!updatedStaff) {
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        // 5. Preparar respuesta
        const responseData = {
            _id: updatedStaff._id,
            id: updatedStaff._id.toString(),
            name: updatedStaff.name,
            identification: updatedStaff.identification,
            phone: updatedStaff.phone || '',
            emergencyContact: updatedStaff.emergencyContact || '',
            asistencia: updatedStaff.asistencia,
            staffType: updatedStaff.staffType ? {
                _id: updatedStaff.staffType._id,
                name: updatedStaff.staffType.name,
                description: updatedStaff.staffType.description || '',
                isActive: updatedStaff.staffType.isActive
            } : null,
            updatedAt: updatedStaff.updatedAt,
            updatedBy: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email
            }
        };

        const executionTime = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Asistencia actualizada exitosamente',
            data: responseData
        });

    } catch (error) {
        console.error('[Staff Controller] Error en updateAttendance:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido',
                field: 'id'
            });
        }

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
            message: 'Error interno al actualizar asistencia'
        });
    }
};

// ----------------------------
// 2.5 Eliminación de personal
// ----------------------------

/**
 * Eliminar un miembro del personal
 * Rol permitido: admin
 */
exports.deleteStaff = async (req, res) => {
    const startTime = Date.now();
    const staffId = req.params.id;
    
    try {
        console.log(`[Staff Controller] Iniciando eliminación de Staff ID: ${staffId} - Usuario: ${req.user?._id}`);
        
        // 1. Verificar autenticación
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado: Debe iniciar sesión primero'
            });
        }

        // 2. Verificar rol de administrador exclusivamente
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: Requiere rol de administrador'
            });
        }

        // 3. Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de ID no válido',
                field: 'id'
            });
        }

        // 4. Verificar si el staff existe
        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        // 5. Verificar si el staff está asignado a algún evento (versión alternativa)
        const assignedEvents = await Event.find({ 
            'assignedStaff.staffId': staffId,
            status: { $ne: 'completed' }
        }).limit(1); // Solo necesitamos saber si existe al menos uno

        if (assignedEvents.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: el personal está asignado a eventos activos',
                code: 'STAFF_ASSIGNED_TO_EVENTS'
            });
        }

        // 6. Eliminar el staff
        const deletionResult = await Staff.deleteOne({ _id: staffId });

        if (deletionResult.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'El miembro del personal ya había sido eliminado'
            });
        }

        // 7. Preparar respuesta exitosa
        const executionTime = Date.now() - startTime;
        res.status(200).json({
            success: true,
            message: 'Miembro del personal eliminado exitosamente',
            data: {
                _id: staffId,
                id: staffId,
                name: staff.name,
                identification: staff.identification,
                deletedAt: new Date()
            }
        });

    } catch (error) {
        console.error('[Staff Controller] Error en deleteStaff:', error);

        // Manejo específico de errores
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido',
                field: 'id'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            success: false,
            message: 'Error interno al eliminar miembro del personal',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
};

// ----------------------------
// Métodos adicionales útiles
// ----------------------------

/**
 * Obtener personal por tipo
 * Roles permitidos: admin, coordinador
 */
exports.getStaffByType = async (req, res) => {
    const startTime = Date.now();
    const staffTypeId = req.params.id;
    
    try {
        // 1. Verificar autenticación y permisos
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const allowedRoles = ['admin', 'coordinador'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        // 2. Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(staffTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff type ID format',
                field: 'id'
            });
        }

        // 3. Buscar el StaffType
        const staffType = await StaffType.findOne({
            _id: staffTypeId,
            ...(req.user.role === 'coordinador' && { isActive: true })
        }).lean();

        if (!staffType) {
            return res.status(404).json({
                success: false,
                message: 'Staff type not found'
            });
        }

        // 4. Configurar paginación
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        // 5. Construir query para Staff
        const staffQuery = { 
            staffTypeId: staffType._id,
            ...(req.query.activeOnly === 'true' && { isActive: true }),
            ...(req.query.name && { name: { $regex: req.query.name, $options: 'i' } })
        };

        // 6. Consultar personal
        const [staff, total] = await Promise.all([
            Staff.find(staffQuery)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Staff.countDocuments(staffQuery)
        ]);

        // 7. Formatear respuesta según requerimientos de los tests
        const responseData = {
            _id: staffType._id,
            name: staffType.name,
            description: staffType.description || '',
            isActive: staffType.isActive,
            staff: staff.map(member => ({
                _id: member._id,
                id: member._id.toString(),
                name: member.name,
                identification: member.identification,
                phone: member.phone || '',
                emergencyContact: member.emergencyContact || '',
                staffTypeId: member.staffTypeId,
                asistencia: member.asistencia || false,
                createdAt: member.createdAt,
                updatedAt: member.updatedAt
            })),
            pagination: {
                total,
                count: staff.length,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        };

        // 8. Responder
        const executionTime = Date.now() - startTime;
        res.status(200).json({
            success: true,
            message: 'Staff retrieved successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Error in getStaffByType:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff type ID',
                field: 'id'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
};

/** 
 * Buscar personal por identificación o nombre
 * Roles permitidos: admin, coordinador, lider
 */
exports.searchStaff = async (req, res) => {
    const startTime = Date.now();
    
    try {
        // 1. Verificar autenticación
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // 2. Validar término de búsqueda
        const { term, limit = 10 } = req.query;
        
        if (!term || term.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Search term must be at least 3 characters',
                field: 'term'
            });
        }

        // 3. Configurar límite de resultados
        const parsedLimit = Math.min(parseInt(limit), 50);
        if (isNaN(parsedLimit)) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be a number',
                field: 'limit'
            });
        }

        // 4. Construir query base
        const searchTerm = term.trim();
        const query = {
            $or: [
                { identification: { $regex: searchTerm, $options: 'i' } },
                { name: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        // 5. Aplicar filtros por rol
        if (req.user.role === 'coordinador') {
            const activeStaffTypes = await StaffType.find({ isActive: true }, '_id');
            query.staffTypeId = { $in: activeStaffTypes.map(st => st._id) };
        } else if (req.user.role === 'lider') {
            const assignedStaffIds = await Event.distinct('assignedStaff.staffId', {
                leaderId: req.user._id
            });
            query._id = { $in: assignedStaffIds };
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        // 6. Buscar personal
        const staff = await Staff.find(query)
            .populate('staffType', 'name description isActive')
            .sort({ name: 1 })
            .limit(parsedLimit)
            .lean();

        // 7. Formatear respuesta según requerimientos de los tests
        const responseData = {
            _id: "search-results", // ID ficticio para la respuesta de búsqueda
            name: "Staff Search Results", // Nombre descriptivo
            searchTerm: searchTerm,
            count: staff.length,
            limit: parsedLimit,
            results: staff.map(member => ({
                _id: member._id,
                id: member._id.toString(),
                name: member.name,
                identification: member.identification,
                phone: member.phone || '',
                emergencyContact: member.emergencyContact || '',
                staffTypeId: member.staffTypeId,
                staffType: member.staffType ? {
                    _id: member.staffType._id,
                    name: member.staffType.name,
                    description: member.staffType.description || '',
                    isActive: member.staffType.isActive
                } : null,
                asistencia: member.asistencia || false,
                createdAt: member.createdAt,
                updatedAt: member.updatedAt
            }))
        };

        // 8. Preparar respuesta final
        const executionTime = Date.now() - startTime;
        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Error in searchStaff:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid search parameter',
                field: error.path
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during search',
            code: 'SEARCH_ERROR'
        });
    }
};