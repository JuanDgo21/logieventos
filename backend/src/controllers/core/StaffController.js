const Staff = require('../../models/core/Staff');
const User = require('../../models/core/User');
const Evento = require('../../models/core/Event');
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
        console.log('Iniciando creación de Staff - Usuario:', req.user?._id);
        
        // 1. Verificación de roles
        if (!['admin', 'coordinador'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: Requiere rol admin o coordinador'
            });
        }

        // 2. Extraer datos del body
        const { staffTypeId, identification, name, phone, emergencyContact } = req.body;

        // 3. Validar campos obligatorios
        const missingFields = [];
        if (!staffTypeId) missingFields.push('staffTypeId');
        if (!identification) missingFields.push('identification');
        if (!name) missingFields.push('name');
        if (!phone) missingFields.push('phone');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Campos obligatorios faltantes: ${missingFields.join(', ')}`
            });
        }

        // 4. Validar formato de identificación
        const idRegex = /^[A-Za-z0-9-]+$/;
        if (!idRegex.test(identification)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de identificación inválido. Solo letras, números y guiones'
            });
        }

        // 5. Validar formato de teléfono
        const phoneRegex = /^\+?\d{7,15}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de teléfono inválido. Ejemplo válido: +584125554433'
            });
        }

        // 6. Verificar identificación única
        const existingId = await Staff.findOne({ identification: identification.trim() });
        if (existingId) {
            return res.status(409).json({
                success: false,
                message: 'La identificación ya está registrada'
            });
        }

        // 7. Validar StaffType
        const staffType = await StaffType.findById(staffTypeId);
        if (!staffType || (req.user.role === 'coordinador' && !staffType.isActive)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de personal no válido o inactivo'
            });
        }

        // 8. Crear el nuevo Staff
        const newStaff = new Staff({
            staffTypeId,
            identification: identification.trim(),
            name: name.trim(),
            phone: phone.trim(),
            emergencyContact: emergencyContact?.trim(),
            createdAt: new Date()
        });

        // 9. Guardar en base de datos
        const savedStaff = await newStaff.save();
        
        // 10. Preparar respuesta
        const result = await Staff.findById(savedStaff._id)
            .populate('staffType', 'name description isActive');

        res.status(201).json({
            success: true,
            message: 'Personal creado exitosamente',
            data: result
        });

    } catch (error) {
        console.error('Error en createStaff:', error);
        
        if (error.name === 'MongoError' && error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Error de duplicado: La identificación ya existe'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno al crear personal',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    try {
        console.log('Consultando Staff - Usuario:', req.user?._id);
        
        // Construir query según el rol del usuario
        let query = {};
        
        // Para líderes, mostrar todo el personal (modificación)
        if (req.user.role === 'lider') {
            console.log('Líder consultando listado completo de personal (solo lectura)');
            
            // Opcional: puedes agregar lógica adicional aquí si necesitas
            // que el líder vea solo ciertos tipos de personal
            // Ejemplo: solo staff activo o de ciertas categorías
            
            // Por ahora permitimos ver todo el personal en modo solo lectura
            query = {};
        }

        // Para coordinadores, solo mostrar tipos de personal activos
        if (req.user.role === 'coordinador') {
            const activeStaffTypes = await StaffType.find({ isActive: true }, '_id');
            query.staffTypeId = { $in: activeStaffTypes.map(st => st._id) };
        }

        // Aplicar filtros desde query params
        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: 'i' };
            console.log('Aplicando filtro por nombre:', req.query.name);
        }

        if (req.query.identification) {
            query.identification = { $regex: req.query.identification, $options: 'i' };
        }

        if (req.query.role) {
            query.role = { $regex: req.query.role, $options: 'i' };
        }

        if (req.query.staffTypeId) {
            query.staffTypeId = req.query.staffTypeId;
        }

        if (req.query.asistencia !== undefined) {
            query.asistencia = req.query.asistencia === 'true';
        }

        // Opciones de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Opciones de ordenamiento
        const sortOptions = {};
        if (req.query.sortBy) {
            const sortFields = req.query.sortBy.split(',');
            sortFields.forEach(field => {
                const sortOrder = field.startsWith('-') ? -1 : 1;
                const fieldName = field.replace(/^-/, '');
                sortOptions[fieldName] = sortOrder;
            });
        } else {
            sortOptions.name = 1; // Ordenar por nombre por defecto
        }

        // Consulta a la base de datos
        const staff = await Staff.find(query)
            .populate('staffType')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();

        // Contar total de documentos para paginación
        const total = await Staff.countDocuments(query);

        console.log(`Staff encontrados: ${staff.length} de ${total}`);

        res.status(200).json({
            success: true,
            count: staff.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: staff
        });

    } catch (error) {
        console.error('Error en getAllStaff:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el personal',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener un miembro del personal por ID
 * Roles permitidos: admin, coordinador, lider (con restricciones)
 */
exports.getStaffById = async (req, res) => {
    try {
        console.log(`Consultando Staff ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn('ID inválido proporcionado');
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido'
            });
        }

        // Construir query según el rol
        let query = { _id: req.params.id };
        
        // Para líderes, verificar que el staff esté asignado a sus eventos
        if (req.user.role === 'lider') {
            console.warn('Líder intentando acceder a personal no asignado');
            return res.status(403).json({
                success: false,
                message: 'Solo puedes ver personal asignado a tus eventos'
            });
        }

        // Para coordinadores, solo mostrar si el staffType está activo
        if (req.user.role === 'coordinador') {
            const staff = await Staff.findById(req.params.id).lean();
            if (staff) {
                const staffType = await StaffType.findById(staff.staffTypeId);
                if (!staffType || !staffType.isActive) {
                    console.warn('StaffType inactivo o no encontrado');
                    return res.status(404).json({
                        success: false,
                        message: 'Personal no encontrado o no accesible'
                    });
                }
            }
        }

        // Consultar el staff con populate de relaciones
        const staff = await Staff.findOne(query)
            .populate('staffType');

        if (!staff) {
            console.warn('Staff no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: staff.toObject()
        });

    } catch (error) {
        console.error('Error en getStaffById:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener miembro del personal',
            error: error.message
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
    try {
        console.log(`Actualizando Staff ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
        // Verificar roles permitidos
        if (!['admin', 'coordinador'].includes(req.user.role)) {
            console.warn('Intento de actualización por usuario no autorizado');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción'
            });
        }

        const { staffTypeId, name, phone, role, emergencyContact, asistencia } = req.body;

        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn('ID inválido proporcionado');
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido'
            });
        }

        // Buscar el staff existente
        const existingStaff = await Staff.findById(req.params.id);
        if (!existingStaff) {
            console.warn('Staff no encontrado para actualizar');
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        // Verificar si el coordinador está intentando modificar staffType
        if (req.user.role === 'coordinador' && staffTypeId && staffTypeId !== existingStaff.staffTypeId.toString()) {
            console.warn('Coordinador intentando cambiar staffTypeId');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cambiar el tipo de personal'
            });
        }

        // Validar que el nuevo staffTypeId exista y esté activo
        if (staffTypeId) {
            const staffType = await StaffType.findById(staffTypeId);
            if (!staffType || (req.user.role !== 'admin' && !staffType.isActive)) {
                console.warn('Tipo de personal no válido o inactivo:', staffTypeId);
                return res.status(400).json({
                    success: false,
                    message: 'El tipo de personal seleccionado no es válido'
                });
            }
            existingStaff.staffTypeId = staffTypeId;
        }

        // Actualizar campos permitidos
        if (name) existingStaff.name = name.trim();
        if (phone) existingStaff.phone = phone.trim();
        if (role) existingStaff.role = role.trim();
        if (emergencyContact !== undefined) {
            existingStaff.emergencyContact = emergencyContact?.trim();
        }
        
        // Actualizar asistencia si viene en el body
        if (typeof asistencia === 'boolean') {
            existingStaff.asistencia = asistencia;
            console.log(`Actualizando asistencia a: ${asistencia}`);
        }

        // Guardar los cambios
        const updatedStaff = await existingStaff.save();
        
        // Hacer populate de las relaciones para la respuesta
        const populatedStaff = await Staff.findById(updatedStaff._id)
            .populate('staffType');

        console.log('Staff actualizado exitosamente:', populatedStaff);

        res.status(200).json({
            success: true,
            message: 'Miembro del personal actualizado exitosamente',
            data: populatedStaff
        });

    } catch (error) {
        console.error('Error en updateStaff:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID proporcionado no válido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar miembro del personal',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    try {
        console.log(`Actualizando asistencia para Staff ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
        // Verificar roles permitidos
        if (!['admin', 'coordinador'].includes(req.user.role)) {
            console.warn('Intento de actualización de asistencia por usuario no autorizado');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción'
            });
        }

        const { asistencia } = req.body;

        // Validar que se proporcione el campo asistencia
        if (asistencia === undefined) {
            console.warn('Campo "asistencia" no proporcionado');
            return res.status(400).json({
                success: false,
                message: 'El campo "asistencia" es requerido'
            });
        }

        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn('ID inválido proporcionado');
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido'
            });
        }

        // Buscar y actualizar el campo asistencia
        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            { asistencia },
            { new: true, runValidators: true }
        ).populate('staffType');

        if (!updatedStaff) {
            console.warn('Staff no encontrado para actualizar asistencia');
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        console.log(`Asistencia actualizada a ${asistencia} para Staff ID: ${updatedStaff._id}`);

        res.status(200).json({
            success: true,
            message: 'Estado de asistencia actualizado exitosamente',
            data: updatedStaff
        });

    } catch (error) {
        console.error('Error en updateAttendance:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar asistencia',
            error: error.message
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
    try {
        console.log(`Eliminando Staff ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
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
                message: 'ID de personal no válido'
            });
        }

        // Verificar si el staff existe
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            console.warn('Staff no encontrado para eliminar');
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        // Verificar si el staff está asignado a algún evento
        // NOTA: Implementar esta verificación cuando exista el modelo de Eventos
        const hasEventAssignments = false;
        
        if (hasEventAssignments) {
            console.warn('Intento de eliminar staff con asignaciones a eventos');
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar: el personal está asignado a uno o más eventos'
            });
        }

        // Eliminar el staff usando deleteOne (solución al error)
        const deletedStaff = await Staff.deleteOne({ _id: req.params.id });

        if (deletedStaff.deletedCount === 0) {
            console.warn('No se eliminó ningún registro');
            return res.status(404).json({
                success: false,
                message: 'No se encontró el miembro del personal para eliminar'
            });
        }

        console.log('Staff eliminado exitosamente:', req.params.id);

        res.status(200).json({
            success: true,
            message: 'Miembro del personal eliminado exitosamente',
            data: { _id: req.params.id, name: staff.name }
        });

    } catch (error) {
        console.error('Error en deleteStaff:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de personal no válido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar miembro del personal',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    try {
        console.log(`Consultando personal por StaffType ID: ${req.params.id} - Usuario: ${req.user?._id}`);
        
        // Verificar roles permitidos
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

        // Verificar que el staffType exista y esté activo (para coordinador)
        const staffType = await StaffType.findOne({
            _id: req.params.id,
            ...(req.user.role === 'coordinador' && { isActive: true })
        });

        if (!staffType) {
            console.warn('StaffType no encontrado o no accesible');
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado o no tienes acceso'
            });
        }

        // Consultar personal asociado
        const staff = await Staff.find({ staffTypeId: staffType._id })
            .populate('staffType')
            .lean();

        console.log(`Personal encontrado para este tipo: ${staff.length}`);

        res.status(200).json({
            success: true,
            staffType: staffType.name,
            count: staff.length,
            data: staff
        });

    } catch (error) {
        console.error('Error en getStaffByType:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de tipo de personal inválido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener personal por tipo',
            error: error.message
        });
    }
};

/**
 * Buscar personal por identificación o nombre
 * Roles permitidos: admin, coordinador, lider
 */
exports.searchStaff = async (req, res) => {
    try {
        console.log(`Búsqueda de personal - Término: ${req.query.term} - Usuario: ${req.user?._id}`);
        
        const { term } = req.query;
        
        if (!term || term.length < 3) {
            console.warn('Término de búsqueda no válido o muy corto');
            return res.status(400).json({
                success: false,
                message: 'El término de búsqueda debe tener al menos 3 caracteres'
            });
        }

        // Construir query según el rol
        let query = {
            $or: [
                { identification: { $regex: term, $options: 'i' } },
                { name: { $regex: term, $options: 'i' } }
            ]
        };

        // Para líderes, solo mostrar personal asignado a sus eventos
        if (req.user.role === 'lider') {
            console.warn('Líder intentando buscar en todo el personal');
            return res.status(403).json({
                success: false,
                message: 'Los líderes solo pueden buscar personal asignado a sus eventos'
            });
        }

        // Para coordinadores, solo mostrar tipos de personal activos
        if (req.user.role === 'coordinador') {
            const activeStaffTypes = await StaffType.find({ isActive: true }, '_id');
            query.staffTypeId = { $in: activeStaffTypes.map(st => st._id) };
        }

        // Limitar resultados
        const limit = parseInt(req.query.limit) || 10;

        // Consultar personal
        const staff = await Staff.find(query)
            .populate('staffType')
            .limit(limit)
            .lean();

        console.log(`Resultados de búsqueda: ${staff.length}`);

        res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });

    } catch (error) {
        console.error('Error en searchStaff:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar personal',
            error: error.message
        });
    }
};