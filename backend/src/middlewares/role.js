/**
 * Middleware para verificar roles permitidos
 * @param {...string} allowedRoles - Roles que tienen permiso para la acción
 * @returns Middleware function que verifica los permisos del usuario
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log(`Verificando permisos para ruta: ${req.path}`);
        
        // 1. Verificar que el usuario esté autenticado y tenga rol
        if (!req.user || !req.user.role) {
            console.error('ERROR: Usuario no autenticado o sin rol definido');
            return res.status(401).json({
                success: false,
                message: 'Acceso no autorizado: usuario no autenticado o sin rol'
            });
        }

        console.log(`Usuario autenticado: ${req.user.email}, Rol: ${req.user.role}`);

        // 2. Verificar que el rol del usuario esté permitido
        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`ADVERTENCIA: Rol ${req.user.role} no tiene permisos para esta acción`);
            return res.status(403).json({
                success: false,
                message: `Acceso denegado: Rol ${req.user.role} no tiene permisos para esta acción`,
                requiredRoles: allowedRoles
            });
        }

        console.log(`Permiso concedido para ${req.user.role}`);
        next();
    };
};

// Funciones específicas por rol (para verificación directa)
const isAdmin = checkRole('administrador');
const isCoordinador = checkRole('coordinador');
const isLider = checkRole('lider');

// Funciones combinadas para operaciones CRUD según permisos
const canCreate = checkRole('administrador', 'coordinador');      // Admin y Coordinador pueden crear
const canRead = checkRole('administrador', 'coordinador', 'lider'); // Todos pueden leer
const canUpdate = checkRole('administrador', 'coordinador');     // Admin y Coordinador pueden actualizar
const canDelete = checkRole('administrador');                     // Solo Admin puede eliminar

module.exports = {
    checkRole,
    isAdmin,
    isCoordinador,
    isLider,
    canCreate,
    canRead,
    canUpdate,
    canDelete
};