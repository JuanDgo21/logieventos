const jwt = require('jsonwebtoken');
const config = require('../config/auth.config.js');
const { User } = require('../models/User.js');

// Log de inicialización para verificar configuración
console.log('[AuthJWT] Configuración cargada: ', config.secret ? '***' + config.secret.slice(-5) : 'NO CONFIGURADO');

/**
 * Middleware principal de verificación de token JWT
 * Verifica la presencia y validez del token y extrae información del usuario
 */
const verifyTokenFn = (req, res, next) => {
    console.log('\n[AuthJWT] Middleware ejecutándose para', req.originalUrl);

    try {
        // Obtener token de headers (compatible con 'x-access-token' y 'Authorization: Bearer')
        const token = req.headers['x-access-token'] || req.headers.authorization?.split(' ')[1];
        console.log('[AuthJWT] Token recibido:', token ? '***' + token.slice(-8) : 'NO PROVISTO');

        // Validar presencia del token
        if (!token) {
            console.log('[AuthJWT] Error: token no proporcionado');
            return res.status(403).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        // Verificar y decodificar el token
        const decoded = jwt.verify(token, config.secret);
        
        // Adjuntar información del usuario al request
        req.userId = decoded.id;
        req.userRole = decoded.role;
        
        console.log('[AuthJWT] Token válido para usuario ID:', decoded.id);
        next();
        
    } catch (error) {
        console.error('[AuthJWT] Error:', error.name, '-', error.message);
        
        // Manejar diferentes tipos de errores de JWT
        const errorMessage = error.name === 'TokenExpiredError' 
            ? 'Token expirado' 
            : 'Token inválido';
        
        return res.status(401).json({
            success: false,
            message: errorMessage,
            error: error.name  // Proporcionar tipo de error para debugging
        });
    }
};

/**
 * Middleware alternativo de autenticación (versión simplificada)
 * @deprecated Se recomienda usar verifyTokenFn en su lugar
 */
const AuthJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,  // Añadido campo success para consistencia
            message: 'Token no proporcionado'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || config.secret);  // Usar variable de entorno o config
        req.user = decoded;  // Adjunta toda la información decodificada
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido',
            error: error.name  // Añadido tipo de error
        });
    }
};

// Validación de integridad del middleware antes de exportar
if (typeof verifyTokenFn !== 'function') {
    console.error('[AuthJWT] ERROR: verifyTokenFn no es una función!');
    throw new Error('verifyTokenFn debe ser una función');
}

console.log('[AuthJWT] Middleware verifyTokenFn es una función:', typeof verifyTokenFn === 'function');

// Exportar los middlewares
module.exports = {
    verifyToken: verifyTokenFn,
    authJWT: AuthJWT  // Exportar ambas versiones pero marcar como deprecated la segunda
};