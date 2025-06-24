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
        
        // Establecer usuario en request
        req.user = {
            _id: decoded.id,     // Asegurar que sea _id para MongoDB
            email: decoded.email,
            role: decoded.role
        };
        
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