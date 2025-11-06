// Importación de modelos y dependencias necesarias
const bcrypt = require('bcryptjs'); 
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

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
    
    // ✅ CORRECCIÓN (S7773): 
    // Se reemplaza la función global isNaN() por Number.isNaN()
    // Nota: Dado que req.body.document puede ser un string, 
    // es mejor negar Number.isFinite() o validar que la conversión sea exitosa.
    // Sin embargo, para mantener la lógica original del bug (revisar si NO es número):
    // Primero intentamos convertirlo a número
    const documentAsNumber = Number(req.body.document);
    
    // Ahora sí, usamos Number.isNaN() sobre el resultado convertido
    if (Number.isNaN(documentAsNumber)) {
      return res.status(400).json({
        success: false,
        message: "El documento debe ser un número",
        field: "document"
      });
    }

    // Creación de nuevo usuario con datos del request
    const user = new User({
      document: req.body.document, // Mongoose lo convertirá según el Schema
      fullname: req.body.fullname,
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
    
    // Corrección S5147 (NoSQL Injection)
    const user = await User.findOne({ email: String(email) }).select('+password');
    
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
/**
 * Función para iniciar el proceso de recuperación (solo verifica email)
 */
const forgotPassword = async (req, res) => {
  console.log('[forgotPassword] Iniciando proceso...');
  try {
    const { email } = req.body;
    console.log(`Email recibido: ${email}`);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es requerido"
      });
    }

    // Solo verificamos que el usuario existe
    
    // Corrección S5147 (NoSQL Injection)
    const user = await User.findOne({ email: String(email) });
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.status(200).json({
        success: true,
        message: "Si el email existe, podrás cambiar tu contraseña"
      });
    }

    // Generamos un token simple sin almacenarlo en la BD
    const resetToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        action: 'password_reset' // Para identificar el propósito
      },
      config.secret,
      { expiresIn: '1h' } // Token válido por 1 hora
    );

    console.log(`Token generado para ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: "Proceso de recuperación iniciado",
      token: resetToken // Enviamos el token al frontend
    });

  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud"
    });
  }
};

/**
 * Función para actualizar la contraseña
 */
const resetPassword = async (req, res) => {
  console.log('[resetPassword] Procesando solicitud...');
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token y nueva contraseña son requeridos"
      });
    }

    // Verificamos el token
    let decoded;
    try {
      decoded = jwt.verify(token, config.secret);
      
      // Verificamos que el token es para reseteo de contraseña
      if (decoded.action !== 'password_reset') {
        throw new Error('Token inválido para esta acción');
      }
    } catch (error) {
      console.error('Token inválido:', error);
      return res.status(400).json({
        success: false,
        message: "Token inválido o expirado"
      });
    }

    // Buscamos al usuario por ID (del token)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Verificamos que el email coincida
    if (user.email !== decoded.email) {
      return res.status(400).json({
        success: false,
        message: "Token no coincide con el usuario"
      });
    }

    console.log(`Actualizando contraseña para usuario: ${user.email}`);

    // Actualizamos la contraseña (el pre-save hook hará el hash)
    user.password = newPassword;
    await user.save();

    console.log('Contraseña actualizada exitosamente');

    res.status(200).json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la contraseña"
    });
  }
};

/**
 * Función para que un usuario logueado cambie su contraseña
 */
// Se declara como una constante, igual que las otras funciones
const changePassword = async (req, res) => {
  try {
    // 1. Encontrar al usuario por el ID que viene en el token (gracias al middleware)
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).send({ message: 'Usuario no encontrado.' });
    }

    const { currentPassword, newPassword } = req.body;

    // 2. Verificar que la contraseña actual sea correcta
    const passwordIsValid = bcrypt.compareSync(
      currentPassword,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({ message: 'La contraseña actual es incorrecta.' });
    }

    // 3. Hashear y guardar la nueva contraseña
    // El middleware .pre('save') de tu modelo User.js se encargará del hasheo automáticamente
    user.password = newPassword;
    await user.save();

    res.status(200).send({ message: '¡Contraseña actualizada correctamente!' });

  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).send({ message: 'Ocurrió un error en el servidor.' });
  }
};

module.exports = {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  changePassword
};