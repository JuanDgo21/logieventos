const User = require('../../models/core/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

/**
 * Obtener todos los usuarios (con filtros por rol)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Construir query según el rol del usuario que hace la petición
    let query = {};
    
    if (req.user.role === 'lider') {
      // Líder solo puede verse a sí mismo
      query = { _id: req.user.id };
    } else if (req.user.role === 'coordinador') {
      // Coordinador no puede ver administradores
      query = { role: { $ne: 'admin' } };
    }
    // Admin puede ver todos (query vacío)

    // Opciones de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Obtener usuarios con paginación
    const users = await User.find(query)
      .select('-password -__v')
      .skip(skip)
      .limit(limit)
      .lean();

    // Contar total de usuarios para paginación
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (error) {
    console.error('[UserController] Error en getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener un usuario por ID
 */
exports.getUserById = async (req, res) => {
  try {
    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario no válido'
      });
    }

    // Buscar usuario
    const user = await User.findById(req.params.id).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar permisos
    if (req.user.role === 'lider' && user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este usuario'
      });
    }

    if (req.user.role === 'coordinador' && user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No puedes ver usuarios administradores'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: user
    });

  } catch (error) {
    console.error('[UserController] Error en getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Crear un nuevo usuario (Admin y Coordinador)
 */
exports.createUser = async (req, res) => {
  try {
    // Validar campos requeridos
    const requiredFields = ['document', 'name', 'email', 'password', 'role'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan campos obligatorios: ${missingFields.join(', ')}`,
        fields: missingFields
      });
    }

    // Validar que el rol sea válido
    const validRoles = ['admin', 'coordinador', 'lider'];
    if (!validRoles.includes(req.body.role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol de usuario no válido',
        field: 'role'
      });
    }

    // Validar permisos según rol del usuario que crea
    if (req.user.role === 'coordinador' && req.body.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No puedes crear usuarios administradores'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Crear nuevo usuario
    const newUser = new User({
      document: req.body.document.trim(),
      name: req.body.name.trim(),
      email: req.body.email.toLowerCase().trim(),
      password: hashedPassword,
      role: req.body.role
    });

    // Guardar en la base de datos
    const savedUser = await newUser.save();

    // Preparar respuesta sin password
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    delete userResponse.__v;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userResponse
    });

  } catch (error) {
    console.error('[UserController] Error en createUser:', error);

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

    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Actualizar usuario
 */
exports.updateUser = async (req, res) => {
  try {
    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario no válido'
      });
    }

    // Buscar usuario a actualizar
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar permisos según rol
    if (req.user.role === 'lider' && userToUpdate._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes modificar tu propio perfil'
      });
    }

    if (req.user.role === 'coordinador') {
      if (userToUpdate.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No puedes modificar administradores'
        });
      }
      if (req.body.role && req.body.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No puedes asignar rol de administrador'
        });
      }
    }

    // Campos permitidos para actualización
    const allowedFields = ['name', 'email', 'document'];
    if (req.user.role === 'admin') {
      allowedFields.push('role');
    }

    // Filtrar solo campos permitidos
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Si se actualiza el email, validar formato
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({
          success: false,
          message: "El formato del email no es válido",
          field: "email"
        });
      }
      updates.email = updates.email.toLowerCase().trim();
    }

    // Si se actualiza la contraseña, hacer hash
    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });

  } catch (error) {
    console.error('[UserController] Error en updateUser:', error);

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

    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Eliminar usuario (SOLO ADMIN)
 */
exports.deleteUser = async (req, res) => {
  try {
    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario no válido'
      });
    }

    // Solo admin puede eliminar usuarios
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar usuarios'
      });
    }

    // Verificar que no sea auto-eliminación
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo'
      });
    }

    // Eliminar usuario
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: {
        id: deletedUser._id,
        email: deletedUser.email
      }
    });

  } catch (error) {
    console.error('[UserController] Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// :3