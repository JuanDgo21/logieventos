// Importación de modelos y dependencias necesarias
const User = require('../models/User'); // Modelo de usuario
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const config = require('../config/auth.config'); // Configuración de autenticación

/**
 * Función para registrar nuevos usuarios
 * Valida los datos, crea el usuario y genera un token JWT
 */
const signup = async (req, res) => {
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
const signin = async (req, res) => {
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

//nuevos
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1. Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    // 2. Generar token de reseteo (con expiración de 1 hora)
    const resetToken = jwt.sign(
      { id: user._id },
      config.secret,
      { expiresIn: '1h' }
    );
    
    // 3. Guardar token en el usuario (opcional)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();
    
    // 4. Enviar email con el token (implementación ficticia)
    // En producción usarías un servicio como Nodemailer
    console.log(`Token de reseteo para ${email}: ${resetToken}`);
    
    res.status(200).json({
      success: true,
      message: "Se ha enviado un enlace de reseteo a tu email",
      token: resetToken // En producción no enviarías esto, es solo para demo
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // 1. Verificar token
    const decoded = jwt.verify(token, config.secret);
    
    // 2. Buscar usuario
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    // 3. Actualizar contraseña
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: "El enlace de reseteo ha expirado"
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: "Token inválido"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error al resetear la contraseña",
      error: error.message
    });
  }
};


module.exports = {
  signup,
  signin,
  forgotPassword,
  resetPassword
};