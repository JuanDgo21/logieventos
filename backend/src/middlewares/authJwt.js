const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

const verifyToken = (req, res, next) => {
    console.log('\n[AuthJWT] Middleware ejecutándose para', req.originalUrl);

    try {
        // Obtener token de headers
        const token = req.headers['x-access-token'] || 
                     req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            console.log('[AuthJWT] Error: Token no proporcionado');
            return res.status(403).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        // Verificar y decodificar token
        const decoded = jwt.verify(token, config.secret);
        
        // Establecer usuario en request (versión mejorada)
        req.user = {
            id: decoded.id,     // Cambiado de _id a id para consistencia
            _id: decoded.id,    // Mantenemos _id para compatibilidad con MongoDB
            email: decoded.email,
            role: decoded.role
        };
        req.userId = decoded.id;
        req.userRole = decoded.role;
        
        console.log(`[AuthJWT] Token válido para: ${decoded.email} (Rol: ${decoded.role})`);
        next();
    } catch (error) {
        console.error('[AuthJWT] Error:', error.name, '-', error.message);
        
        let status = 401;
        let message = 'Token inválido';
        
        if (error.name === 'TokenExpiredError') {
            status = 403;
            message = 'Token expirado';
        }
        
        return res.status(status).json({
            success: false,
            message,
            error: error.name
        });
    }
};

module.exports = { verifyToken };