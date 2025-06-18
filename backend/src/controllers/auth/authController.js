const User = require('../../models/core/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/auth.config');

// Roles del sistema
const ROLES = {
    ADMIN: 'admin',
    COORDINADOR: 'coordinador',
    LIDER: 'lider'
};

// Funcion para verificar permisos
const checkPermission = (userRole, allowedRoles) => {
    return allowedRoles.includes(userRole);
};

// 1. Registro de usuarios (SOLO ADMIN)
exports.register = async (req, res) => {
    try {
        // Validación manual adicional
        if (!req.body.name || req.body.name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "El nombre es requerido",
                field: "name"
            });
        }

        // Crear instancia de usuario
        const user = new User({
            document: req.body.document.trim(),
            name: req.body.name.trim(),
            email: req.body.email.toLowerCase().trim(),
            password: req.body.password,
            role: req.body.role || 'lider'
        });

        // Guardar usuario en la base de datos
        const savedUser = await user.save();

        // Generar  token JWT
        const token = jwt.sign(
            {
                id: savedUser._id,
                role: savedUser.role
            },
            config.secret,
            { expiresIn: config.jwtExpiration }
        );

        // Preparar respuesta sin datos sensibles
        const userData = savedUser.toObject();
        delete userData.password;

        res.status(201).json({
            success: true,
            message: "Usuario registrado exitosamente",
            token: token,
            user: userData
        });

    } catch (error) {
        console.error('[AuthController] Error en registro:', error);

        // Manejo especial de errores de MongoDB
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `El ${field} ya está en uso`,
                field: field
            });
        }

        // Manejo de otros errores de validación
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
                errors: error.errors
            });
        }

        res.status(500).json({
            success: false,
            message: "Error al registrar usuario",
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password} = req.body;

        // 1. Validación básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email y contraseña son requeridos"
            });
        }

        // 2. Buscar usuario incluyendo el passwotd (que normalmente está oculto)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // 3. Comparar contraseñas
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas"
            });
        }

        // 4. Generar token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            config.secret,
            { expiresIn: config.jwtExpiration }
        );

        // 5. Preparar respuesta sin datos sensibles
        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({
            success: true,
            message: "Autenticación exitosa",
            token,
            user: userData
        });

    } catch (error) {
        console.error('[AuthController] Error en login:', error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor",
            error: error.message
        });
    }
};

// 4. Obtener usuario por ID (Admin y Coordinador)
exports.getUserById = async (req, res) => {
    console.log('\n=== INICIO CONSULTA POR ID - SOLUCIÓN DEFINITIVA ===');

    try{
        // 1. Validación extrema del ID
        const id = req.params.id;
        console.log('[1] ID recibido:', id);

        if (!id || typeof id !== 'string' || id.length !== 24) {
            console.log('[ERROR] ID inválido');
            return res.status(400).json({
                success: false,
                message: "ID de usuario no válido"
            });
        }

        // 2. Control de acceso (como en otros endpoints)
        console.log('[2] Verificando permisos...');
        const isAllowed = req.roles.includes('admin') ||
                          req.roles.includes('coordinador') ||
                          req.userId === id;
        
        if (!isAllowed) {
            console.log('[PERMISO DENEGADO]');
            return res.status(403).json({
                success: false,
                message: "No autorizado"
            });
        }

        // 3. Consulta directa a MongoDB (sin relaciones)
        console.log('[3] Ejecutando consulta directa...');
        const db = req.app.get('mongoDb'); // Conexión directa a MongoDB

        // 3.1 Buscar usuario
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(id) },
            { projection: { _id: 1, document: 1, name: 1, email: 1, createdAt: 1, updatedAt: 1 } }
        );

        console.log('[4] Usuario encontrado:', user);
        if (!user) {
            console.log('[ERROR] Usuario no existe');
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // 3.2 Buscar roles en dos pasos explicitos
        console.log('[5] Buscando roles...');
        const userRoles = await db.collection('user_roles').find(
            { userId: new ObjectId(id) }
        ).toArray();

        const rolesIds = userRoles.map(ur => ur.roleId);
        const roles = await db.collection('roles').find(
            { _id: { $in: roleIds } }
        ).toArray();

        console.log('[6] Roles encontrados:', roles.map(r => r.name));

        // 4. Formatear respuesta (igual que otros endpoints)
        const response = {
            success: true,
            data: {
                id: user._id,
                document: user.document,
                name: user.name,
                email: user.email,
                roles: roles.map(r => r.name),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        };

        console.log('[7] CONSULTA EXITOSA');
        return res.json(response);

    } catch (error) {
        console.error('[ERROR CRÍRICO]', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            details: {
                errorCode: error.code || 'N/A',
                errorType: error.name
            }
        });

        return res.status(500).json({
            success: false,
            message: "Error al obtener usuario",
            error: process.env.NODE_ENV === 'development' ? {
                type: error.name,
                message: error.message,
                code: error.code
            } : undefined
        });
    }
};

// 5. Actualizar usuario (Admin puede actualizar todos, Coordinador solo líderes, Líder solo asi mismo)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const currentUserRole = req.userRole;
        const currentUserId = req.userId;

        // Buscar usuario a actualizar
        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar permisos
        if (currentUserRole === ROLES.LIDER && userToUpdate._id.toString() !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes modificar tu propio perfil'
            });
        }

        if (currentuserRole === ROLES.COORDINADOR && userToUpdate.role === ROLES.ADMIN) {
            return res.status(403).json({
                success: false,
                message: 'No puedes modificar administradores'
            });
        }

        // Actualizar campos permitidos
        const allowedFields = ['name', 'email'];
        if (currentUserRole === ROLES.ADMIN) {
            allowedFields.push('role');
        }

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        // Si se actualiza password, hacer hash
        if (updates.password) {
            filteredUpdates.password = bcrypt.hashSync(updates.password, 8);
        }

        const updatedUser = await User.findByIdAndUpdate(id, filteredUpdates, { new: true }).select('-password -__v');

        return res.status(200).json({
            success: true,
            message: 'Usuario actualizado',
            data: updatedUser
        });

    } catch (error) {
        console.error('Error en updateUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario'
        });
    }
};

// 6. Eliminar usuario (SOLO ADMIN)
exports.deleteUser = async (req, res) => {
    try {
        // Verificar que sea admin
        if (!checkPermission(req.userRole, [ROLES.ADMIN])) {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores pueden eliminar usuarios'
            });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Usuario eliminado correctamente'
        });

    } catch (error) {
        console.error('Error en deleteUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario'
        });
    }
}