/**
 * Middleware para verificar roles permitidos con reglas específicas
 * @param {...string} allowedRoles - Roles que tienen permiso para la acción
 * @returns Middleware function que verifica los permisos del usuario
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log(`[Role Check] Ruta: ${req.method} ${req.path} | Usuario: ${req.user?.email}`);
        
        // 1. Verificación básica de autenticación
        if (!req.user || !req.user.role) {
            console.error('[Role Check] Error: Usuario no autenticado');
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        // 2. Reglas especiales por método HTTP
        if (req.user.role === 'coordinador' && req.method === 'DELETE') {
            console.warn('[Role Check] Coordinador intentando eliminar');
            return res.status(403).json({
                success: false,
                message: 'Coordinadores no pueden eliminar registros'
            });
        }

        if (req.user.role === 'lider' && req.method !== 'GET') {
            console.warn('[Role Check] Líder intentando modificar');
            return res.status(403).json({
                success: false,
                message: 'Líderes solo pueden consultar información'
            });
        }

        // 3. Verificación general de roles permitidos
        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`[Role Check] Rol no autorizado: ${req.user.role}`);
            return res.status(403).json({
                success: false,
                message: 'Permisos insuficientes para esta acción',
                requiredRoles: allowedRoles,
                yourRole: req.user.role
            });
        }

        console.log(`[Role Check] Acceso concedido a ${req.user.role}`);
        next();
    };
};

// Funciones específicas por rol
const isAdmin = checkRole('admin');
const isCoordinador = checkRole('admin', 'coordinador'); // Incluye admin para flexibilidad
const isLider = checkRole('admin', 'coordinador', 'lider');

// Funciones para operaciones CRUD (versión mejorada)
const fullAccess = checkRole('admin');
const readWriteAccess = checkRole('admin', 'coordinador');
const readOnlyAccess = checkRole('admin', 'coordinador', 'lider');

module.exports = {
    checkRole,
    isAdmin,
    isCoordinador,
    isLider,
    fullAccess,       // Solo Admin
    readWriteAccess,  // Admin + Coordinador (excepto DELETE)
    readOnlyAccess    // Todos los roles (solo GET)
};