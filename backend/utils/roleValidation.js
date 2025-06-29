/**
 * Valida si el rol de usuario tiene los permisos requeridos
 * @param {string} userRole - Rol del usuario actual
 * @param {Array<string>} allowedRoles - Lista de roles permitidos
 * @throws {Error} - Lanza un error con status 403 si el acceso es denegado
 */
function validatePermissions(userRole, allowedRoles) {
    // Verifica si el rol del usuario está incluido en los roles permitidos
    if (!allowedRoles.includes(userRole)) {
        // Crea un nuevo error de acceso denegado
        const error = new Error('Acceso denegado: permisos insuficientes');
        
        // Asigna el código de estado 403 (Forbidden) al error
        error.status = 403;
        
        // Lanza el error para ser capturado por el manejador de errores
        throw error;
    }
}

// Exporta la función para poder usarla en otros archivos
module.exports = { validatePermissions };