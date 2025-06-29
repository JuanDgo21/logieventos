const User = require('../models/User');

// Definición centralizada de roles permitidos
const ROLES_PERMITIDOS = {
  ADMIN: 'admin',
  COORDINADOR: 'coordinador',
  LIDER: 'lider'
};

// Convertimos a array para las validaciones
const LISTA_ROLES = Object.values(ROLES_PERMITIDOS);

/**
 * Middleware para verificar duplicados de username o email
 * @async
 */
const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    const { username, email } = req.body;

    // Validación temprana de campos requeridos
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username y email son requeridos"
      });
    }

    // Búsqueda en paralelo para mejor performance
    const [userByUsername, userByEmail] = await Promise.all([
      User.findOne({ username }).collation({ locale: 'en', strength: 2 }), // Case insensitive
      User.findOne({ email }).collation({ locale: 'en', strength: 2 }) // Case insensitive
    ]);

    // Manejo de errores específicos
    if (userByUsername && userByEmail) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario y el email ya están en uso",
        errors: {
          username: "Ya existe",
          email: "Ya existe"
        }
      });
    }

    if (userByUsername) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario ya está en uso",
        field: "username"
      });
    }

    if (userByEmail) {
      return res.status(400).json({
        success: false,
        message: "El email ya está en uso",
        field: "email"
      });
    }

    next();
  } catch (error) {
    console.error('Error en checkDuplicateUsernameOrEmail:', error);
    res.status(500).json({
      success: false,
      message: "Error interno al validar credenciales",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware para validar roles existentes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const checkRolesExisted = (req, res, next) => {
  const { role } = req.body;

  // Solo validar si se proporciona un rol
  if (role) {
    if (!LISTA_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rol no válido: ${role}`,
        validRoles: LISTA_ROLES,
        providedRole: role
      });
    }
  }

  next();
};

module.exports = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  ROLES_PERMITIDOS // Exportar constantes para uso consistente
};