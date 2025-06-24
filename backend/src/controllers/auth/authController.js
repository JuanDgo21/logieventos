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

/**
 * Registro de usuarios (SOLO ADMIN)
 */
exports.register = async (req, res) => {
  try {
    // Validación de campos requeridos
    const requiredFields = ['document', 'name', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan campos obligatorios: ${missingFields.join(', ')}`,
        fields: missingFields
      });
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: "El formato del email no es válido",
        field: "email"
      });
    }

    // Crear instancia de usuario
    const user = new User({
      document: req.body.document.trim(),
      name: req.body.name.trim(),
      email: req.body.email.toLowerCase().trim(),
      password: req.body.password,
      role: req.body.role || ROLES.LIDER
    });

    // Guardar usuario en la base de datos
    const savedUser = await user.save();

    // Generar token JWT
    const token = jwt.sign(
      {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role
      },
      config.secret,
      { expiresIn: config.jwtExpiration }
    );

    // Preparar respuesta
    const userResponse = {
      id: savedUser._id,
      document: savedUser.document,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token: token,
      user: userResponse
    });

  } catch (error) {
    console.error('[AuthController] Error en registro:', error);

    // Manejo de errores de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está registrado`,
        field: field
      });
    }

    // Manejo de errores de validación
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: errors
      });
    }

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login de usuarios
 */
exports.login = async (req, res) => {
  try {
    // Validación de campos requeridos
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
        fields: ['email', 'password']
      });
    }

    // Buscar usuario incluyendo el password (que normalmente está oculto)
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim() })
      .select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      config.secret,
      { expiresIn: config.jwtExpiration }
    );

    // Preparar respuesta
    const userResponse = {
      id: user._id,
      document: user.document,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      message: "Autenticación exitosa",
      token: token,
      user: userResponse
    });

  } catch (error) {
    console.error('[AuthController] Error en login:', error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verificar token (para validar sesiones)
 */
exports.verifyToken = async (req, res) => {
  try {
    // El middleware verifyToken ya validó el token y lo adjuntó a req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Token no válido"
      });
    }

    // Buscar usuario en la base de datos
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Token válido",
      user: {
        id: user._id,
        document: user.document,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('[AuthController] Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: "Error al verificar token",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};