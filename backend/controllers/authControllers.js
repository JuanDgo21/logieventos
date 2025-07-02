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
    // Validación de campos requeridos
    if (!req.body.username || req.body.username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario es requerido",
        field: "username"
      });
    }

    if (!req.body.document || req.body.document.toString().trim() === '') {
      return res.status(400).json({
        success: false,
        message: "El documento es requerido",
        field: "document"
      });
    }

    // Validar que el documento sea numérico
    if (isNaN(req.body.document)) {
      return res.status(400).json({
        success: false,
        message: "El documento debe ser un número",
        field: "document"
      });
    }

    // Creación de nuevo usuario con datos del request
    const user = new User({
      username: req.body.username.trim(), // Elimina espacios
      email: req.body.email.toLowerCase().trim(), // Normaliza email
      password: req.body.password, // La encriptación se maneja en el modelo (pre-save hook)
      role: req.body.role || 'lider' // Rol por defecto 'lider' si no se especifica
    });

    // Resto del código permanece igual...
    const savedUser = await user.save();
    
    const token = jwt.sign(
      { 
        id: savedUser._id,
        role: savedUser.role
      },
      config.secret,
      { expiresIn: config.jwtExpiration }
    );

    const userData = savedUser.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token: token,
      user: userData
    });

  } catch (error) {
    // Manejo de errores permanece igual...
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está en uso`,
        field: field
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        errors: error.errors
      });
    }

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
    
    // 2. Generar token de reseteo
    const resetToken = jwt.sign(
      { id: user._id },
      config.secret,
      { expiresIn: '1h' }
    );
    
    // 3. Guardar token en el usuario (asegurando que todos los campos requeridos estén presentes)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    
    // Si document es requerido, asegúrate de que tenga un valor
    if (user.isModified('document') && !user.document) {
      user.document = 'default-value-or-empty'; // Proporciona un valor por defecto
    }
    
    await user.save();
    
    // 4. Log (en producción enviarías un email)
    console.log(`Token de reseteo para ${email}: ${resetToken}`);
    
    res.status(200).json({
      success: true,
      message: "Se ha enviado un enlace de reseteo a tu email",
      token: resetToken
    });
    
  } catch (error) {
    console.error('Error en forgotPassword:', error);
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
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token y nueva contraseña son requeridos"
      });
    }
    
    // 1. Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, config.secret);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Token inválido o expirado"
      });
    }
    
    // 2. Buscar usuario
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    // 3. Verificar que el token coincida con el guardado
    if (user.resetPasswordToken !== token) {
      return res.status(400).json({
        success: false,
        message: "Token no coincide con el registrado"
      });
    }
    
    // 4. Verificar que el token no haya expirado
    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        message: "El token ha expirado"
      });
    }
    
    // 5. Actualizar contraseña
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });
    
  } catch (error) {
    console.error('Error en resetPassword:', error);
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