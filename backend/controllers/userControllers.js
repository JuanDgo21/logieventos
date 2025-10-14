const User = require('../models/User'); // Importa el modelo de Usuario
const bcrypt = require('bcryptjs'); // Importa bcrypt para el hash de contraseñas

// Controlador para obtener todos los usuarios (solo accesible por administradores)
exports.getAllUsers = async (req, res) => {
  console.log('Iniciando getAllUsers');
  try {
    console.log('Validando rol de usuario');

    let users; // ✅ Declaración de la variable antes de usarla

    if (req.userRole === 'auxiliar') {
      // Solo ve su propio usuario
      users = await User.find({ _id: req.userId }).select('-password');
    } else if (req.userRole === 'coordinador') {
      // Ve a todos menos los administradores
      users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    } else {
      // Admin ve todos los usuarios
      users = await User.find().select('-password');
    }

    console.log('Usuarios encontrados:', users.length);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error en getAllUsers:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  } finally {
    console.log('Finalizada ejecución de getAllUsers');
  }
};


// Controlador para obtener un usuario específico por ID
exports.getUserById = async (req, res) => {
  console.log(`Iniciando getUserById para ID: ${req.params.id}`);
  console.log(`Usuario autenticado ID: ${req.userId}, Rol: ${req.userRole}`); // Agregar este log
  
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    console.log(`Usuario encontrado - ID: ${user._id}, Rol: ${user.role}`); // Agregar este log
    // Validaciones de acceso según el rol del solicitante:
    
    // Si es líder, solo puede ver su propio perfil
    if (req.userRole === 'lider') {
      if (req.userId !== user._id.toString()) {
        console.log('Acceso denegado: Lider intentando ver otro perfil');
        return res.status(403).json({
          success: false,
          message: 'Solo puedes ver tu propio perfil'
        });
      }
      console.log('Lider viendo su propio perfil - acceso permitido');
    }
    
    // Coordinadores no pueden ver administradores
    if (req.userRole === 'coordinador' && user.role === 'admin') {
      console.log('Acceso denegado: Coordinador intentando ver admin');
      return res.status(403).json({
        success: false,
        message: 'No puedes ver usuarios admin'
      });
    }
    
    console.log('Acceso permitido, devolviendo datos del usuario');
    // Si pasa todas las validaciones, devuelve el usuario
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error en getUserById:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario', 
      error: error.message
    });
  } finally {
    console.log('Finalizada ejecución de getUserById');
  }
};

// Controlador para crear un nuevo usuario (solo admin y coordinadores)
exports.createUser = async (req, res) => {
  console.log('Iniciando createUser con datos:', req.body);
  try {
    // Extrae los datos del cuerpo de la solicitud
    const { document, fullname, username, email, password, role } = req.body;

    console.log('Validando rol del usuario que realiza la acción:', req.userRole);
    // Solo admin y coordinador pueden crear usuarios
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      console.log('Acceso denegado: Rol no autorizado para crear usuarios');
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para crear usuarios'
      });
    }

    // Lista de roles válidos
    const validRoles = ['admin', 'coordinador', 'lider'];
    if (role && !validRoles.includes(role)) {
      console.log('Rol no válido proporcionado:', role);
      return res.status(400).json({
        success: false,
        message: 'Rol no válido'
      });
    }

    // Coordinador no puede crear administradores
    if (req.userRole === 'coordinador' && role === 'admin') {
      console.log('Intento de coordinador de crear admin - denegado');
      return res.status(403).json({
        success: false,
        message: 'No puedes crear usuarios con rol de admin'
      });
    }

    console.log('Creando nuevo usuario en la base de datos');
    // Crea el nuevo usuario con la contraseña hasheada
    const user = new User({
      document,
      fullname,
      username,
      email,
      password: await bcrypt.hash(password, 10), // Hash de la contraseña
      role: role || 'lider', // Rol por defecto
      active: true            // ✅ El usuario se crea como activo por defecto
    });


    // Guarda el usuario en la base de datos
    const savedUser = await user.save();
    console.log('Usuario creado exitosamente:', savedUser._id);
    
    // Devuelve respuesta exitosa (sin incluir la contraseña)
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: savedUser._id,
        document: savedUser.document,
        fullname: savedUser.fullname,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
      }
    });
  } catch (error) {
    console.error('Error en createUser:', error.message);
    // Manejo específico para errores de duplicados
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.log('Error de duplicado en campo:', field);
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está en uso`,
        field: field
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario', 
      error: error.message
    });
  } finally {
    console.log('Finalizada ejecución de createUser');
  }
};

// Controlador para actualizar un usuario existente
exports.updateUser = async (req, res) => {
  console.log(`Iniciando updateUser para ID: ${req.params.id} con datos:`, req.body);
  try {
    const { document, fullname, username, email, password, role, active } = req.body;
    const updateData = {};

    console.log('Validando permisos para actualización');
    // Validaciones de permisos:
    
    // Líderes solo pueden actualizar su propio perfil
    if (req.userRole === 'lider' && req.userId !== req.params.id) {
      console.log('Acceso denegado: Lider intentando actualizar otro perfil');
      return res.status(403).json({
        success: false,
        message: 'Solo puedes actualizar tu propio perfil'
      });
    }

    // Coordinadores no pueden actualizar administradores
    if (req.userRole === 'coordinador') {
      const userToUpdate = await User.findById(req.params.id);
      if (userToUpdate.role === 'admin') {
        console.log('Acceso denegado: Coordinador intentando actualizar admin');
        return res.status(403).json({
          success: false,
          message: 'No puedes actualizar usuarios admin'
        });
      }
    }

    // Construye el objeto de actualización con los campos proporcionados
    if (document) updateData.document = document;
    if (fullname) updateData.fullname = fullname;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (typeof active === 'boolean') updateData.active = active;
    
    // Manejo especial para el campo 'role' (solo editable por admin)
    if (role) {
      if (req.userRole === 'admin') {
        updateData.role = role;
        console.log('Admin cambiando rol a:', role);
      } else {
        console.log('Usuario no admin intentando cambiar rol - denegado');
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden cambiar roles'
        });
      }
    }
    
    // Si se proporciona contraseña, se hashea
    if (password) {
      console.log('Actualizando contraseña (hash)');
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    console.log('Datos a actualizar:', updateData);
    // Busca y actualiza el usuario
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } // Devuelve el documento actualizado
    ).select('-password'); // Excluye la contraseña en la respuesta

    if (!updatedUser) {
      console.log('Usuario no encontrado para actualizar');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('Usuario actualizado exitosamente:', updatedUser._id);
    res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error en updateUser:', error.message);
    // Manejo de errores de duplicados
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.log('Error de duplicado en campo:', field);
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está en uso`,
        field: field
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario', 
      error: error.message
    });
  } finally {
    console.log('Finalizada ejecución de updateUser');
  }
};

// Controlador para eliminar un usuario (solo accesible por administradores)
exports.deleteUser = async (req, res) => {
  console.log(`Iniciando deleteUser para ID: ${req.params.id}`);
  try {
    // Verifica que el solicitante sea administrador
    if (req.userRole !== 'admin') {
      console.log('Acceso denegado: Usuario no admin intentando eliminar');
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar usuarios'
      });
    }

    // Previene que un admin se elimine a sí mismo
    if (req.userId === req.params.id) {
      console.log('Intento de auto-eliminación - denegado');
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo'
      });
    }

    console.log('Eliminando usuario de la base de datos');
    // Busca y elimina el usuario
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      console.log('Usuario no encontrado para eliminar');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('Usuario eliminado exitosamente:', deletedUser._id);
    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error en deleteUser:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  } finally {
    console.log('Finalizada ejecución de deleteUser');
  }
};