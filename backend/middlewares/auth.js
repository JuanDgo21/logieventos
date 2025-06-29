const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de autenticación JWT
 * Verifica la validez del token y adjunta el usuario al request
 */
exports.authenticate = async (req, res, next) => {
    try {
        // Extraer token del header Authorization (eliminando 'Bearer' si existe)
        const token = req.header('Authorization')?.replace('Bearer', '').trim();

        // Validar presencia del token
        if(!token){
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación requerido'
            });
        }

        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario en la base de datos usando el ID del token
        const user = await User.findById(decoded.id);

        // Validar existencia del usuario
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Adjuntar el usuario al objeto request para uso en siguientes middlewares/rutas
        req.user = user;
        
        // Pasar al siguiente middleware
        next();
        
    } catch (error){
        // Manejar errores de token inválido/expirado
        res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
            error: error.message // Opcional: detalle del error para desarrollo
        });
    }
};

/**
 * Middleware de autorización basado en roles
 * Verifica que el usuario tenga los roles requeridos
 * 
 * @param {Array} roles - Lista de roles permitidos
 * @returns {Function} Middleware function
 */
exports.authorize = (roles) => {
    return (req, res, next) => {
        // Verificar si el rol del usuario está incluido en los roles permitidos
        if(!roles.includes(req.user.role)){ // Nota: Corregido de req.user.roles a req.user.role
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para esta acción',
                requiredRoles: roles,
                currentRole: req.user.role // Nota: Corregido de req.user.roles a req.user.role
            });
        }
        
        // Pasar al siguiente middleware si la autorización es exitosa
        next();
    };
};