// Importación de modelos y dependencias necesarias
const User = require('../models/User'); // Modelo de usuario
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const config = require('../config/auth.config'); // Configuración de autenticación

/**
 * Función para registrar nuevos usuarios
 * Valida los datos, crea el usuario y genera un token JWT
 */
const register = async (req, res) => {
  try {
    // Validación del nombre de usuario
    if (!req.body.username || req.body.username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario es requerido",
        field: "username" // Indica qué campo falló
      });
    }

    // Creación de nuevo usuario con datos del request
    const user = new User({
      document: req.body.document,
      fullname: req.body.fullname,
      username: req.body.username.trim(), // Elimina espacios
      email: req.body.email.toLowerCase().trim(), // Normaliza email
      password: req.body.password, // La encriptación se maneja en el modelo (pre-save hook)
      role: req.body.role || 'lider' // Rol por defecto 'lider' si no se especifica
    });

    // Guardar usuario en la base de datos
    const savedUser = await user.save();
    
    // Generar token JWT con datos del usuario
    const token = jwt.sign(
      { 
        id: savedUser._id, // ID del usuario
        role: savedUser.role // Rol del usuario
      },
      config.secret, // Secreto para firmar el token
      { expiresIn: config.jwtExpiration } // Tiempo de expiración
    );

    // Preparar datos del usuario para respuesta (sin password)
    const userData = savedUser.toObject();
    delete userData.password;

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token: token, // Token generado
      user: userData // Datos del usuario (sin password)
    });

  } catch (error) {
    // Manejo de errores específicos
    
    // Error de duplicado (email o username existente)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]; // Obtiene el campo duplicado
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está en uso`,
        field: field // Indica qué campo está duplicado
      });
    }

    // Error de validación (mongoose validation)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '), // Todos los mensajes de error
        errors: error.errors // Detalles de los errores
      });
    }

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message
    });
  }
};

/**
 * Función para autenticar usuarios existentes
 * Verifica credenciales y genera token JWT si son válidas
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validación de campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos"
      });
    }

    // Buscar usuario incluyendo el password (normalmente excluido)
    const user = await User.findOne({ email }).select('+password');
    
    // Usuario no encontrado
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Comparar contraseña proporcionada con hash almacenado
    const isMatch = await user.comparePassword(password);
    
    // Contraseña incorrecta
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, // Payload del token
      config.secret,
      { expiresIn: config.jwtExpiration }
    );

    // Preparar datos del usuario para respuesta (sin password)
    const userData = user.toObject();
    delete userData.password;

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: "Autenticación exitosa",
      token, // Token generado
      user: userData, // Datos del usuario (sin password)
      role: user.role
    });

  } catch (error) {
    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message
    });
  }
};

// Exportar funciones del controlador
module.exports = {
  register, // Función de registro
  login  // Función de autenticación
};