/**
 * Middleware de verificación de roles genérico
 * @param {string|Array} allowedRoles - Rol o roles permitidos
 * @returns {Function} Middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log('[RoleCheck] userRole recibido:', req.userRole);
    // 1. Verificación de seguridad básica
    if (!req.userRole) {
      console.error('[RoleCheck] Error: userRole no está definido en el request');
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar permisos',
        errorCode: 'ROLE_VERIFICATION_ERROR'
      });
    }

    // 2. Normalización de roles permitidos (siempre trabajar con array)
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // 3. Verificación de permisos
    const hasPermission = rolesArray.includes(req.userRole);
    
    if (!hasPermission) {
      // 4. Logging detallado para auditoría de seguridad
      console.warn(
        `[RoleCheck] Acceso denegado:\n` +
        `- Ruta: ${req.method} ${req.originalUrl}\n` +
        `- Usuario: ${req.userId}\n` +
        `- Rol actual: ${req.userRole}\n` +
        `- Roles requeridos: ${rolesArray.join(', ')}`
      );
      
      // 5. Respuesta detallada pero segura
      return res.status(403).json({
        success: false,
        message: 'No tienes los permisos necesarios para esta acción',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: rolesArray,
        currentRole: req.userRole,
        timestamp: new Date().toISOString()
      });
    }

    // 6. Continuar si todo está correcto
    next();
  };
};

/**
 * Middleware para verificar rol de Administrador
 * @example router.get('/admin-route', isAdmin, adminController.handler)
 */
const isAdmin = (req, res, next) => {
  req.requiredRole = 'admin'; // Para propósitos de logging
  return checkRole(['admin'])(req, res, next);
};

/**
 * Middleware específico para Coordinadores con mensaje personalizado
 * @example router.get('/coord-route', isCoordinador, coordController.handler)
 */
const isCoordinador = (req, res, next) => {
  if (req.userRole !== 'coordinador') {
    console.warn(`Intento de acceso como coordinador fallido por usuario ${req.userId}`);
    return res.status(403).json({
      success: false,
      message: 'Esta acción requiere privilegios de coordinador',
      errorCode: 'COORDINATOR_REQUIRED',
      currentRole: req.userRole
    });
  }
  next();
};

/**
 * Middleware para verificar rol de Líder
 * @example router.get('/lider-route', isLider, liderController.handler)
 */
const isLider = (req, res, next) => {
  req.requiredRole = 'lider';
  return checkRole(['lider'])(req, res, next);
};

/**
 * Middleware flexible para múltiples roles
 * @param {Array} roles - Lista de roles permitidos
 * @example router.get('/multi-route', checkMultipleRoles(['admin', 'lider']), controller.handler)
 */
const checkMultipleRoles = (roles) => {
  return (req, res, next) => {
    req.requiredRoles = roles; // Almacena para logging
    return checkRole(roles)(req, res, next);
  };
};

module.exports = {
  checkRole,          // Middleware genérico
  checkMultipleRoles, // Para múltiples roles
  isAdmin,            // Solo admin
  isCoordinador,      // Solo coordinador (con mensaje especial)
  isLider             // Solo líder
};