const Personnel = require('../models/Personnel');
const PersonnelType = require('../models/PersonnelType');
const Contract = require('../models/Contract');

/**
 * Controlador: Obtener todo el personal
 * Acceso: Todos los roles (pero líderes solo ven personal activo)
 */
exports.getAllPersonnel = async (req, res) => {
  try {
    // Filtro especial para líderes (solo personal disponible)
    const filter = req.userRole === 'lider' ? { status: 'disponible' } : {};
    
    // Buscar todo el personal con su tipo de personal asociado
    const personnel = await Personnel.find(filter)
      .populate('personnelType', 'name rate') // Solo nombre y tarifa del tipo
      .sort({ lastName: 1, firstName: 1 }); // Ordenar por apellido y nombre
      
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: personnel
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener personal',
      error: error.message
    });
  }
};

/**
 * Controlador: Obtener personal por ID
 * Acceso: Todos los roles (pero líderes solo pueden ver activos)
 */
exports.getPersonnelById = async (req, res) => {
  try {
    // Buscar personal por ID con información de su tipo
    const person = await Personnel.findById(req.params.id)
      .populate('personnelType', 'name description rate');
      
    // Si no se encuentra el personal
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Personal no encontrado'
      });
    }
    
    // Validación especial para líderes (solo pueden ver personal activo)
    if (req.userRole === 'lider' && person.status !== 'disponible') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este personal'
      });
    }
    
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: person
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener personal',
      error: error.message
    });
  }
};

/**
 * Controlador: Crear nuevo personal
 * Acceso: Solo administradores y coordinadores
 */
exports.createPersonnel = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear personal'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { firstName, lastName, email, phone, personnelType, skills } = req.body;
    
    // Validar campos obligatorios
    if (!firstName || !lastName || !email || !personnelType) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellido, email y tipo de personal son campos obligatorios'
      });
    }

    // Verificar que el tipo de personal exista
    const personnelTypeExists = await PersonnelType.findById(personnelType);
    if (!personnelTypeExists) {
      return res.status(404).json({
        success: false,
        message: 'El tipo de personal especificado no existe'
      });
    }

    // Crear nueva instancia del personal
    const person = new Personnel({
      firstName,
      lastName,
      email,
      phone,
      personnelType,
      skills: skills || [], // Habilidades opcionales (array vacío por defecto)
      status: 'disponible' // Estado por defecto
    });

    // Guardar en la base de datos
    const savedPersonnel = await person.save();
    
    // Respuesta exitosa (status 201 - Created)
    res.status(201).json({
      success: true,
      message: 'Personal creado exitosamente',
      data: savedPersonnel
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (email único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe personal con ese email',
        field: 'email'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al crear personal',
      error: error.message
    });
  }
};

/**
 * Controlador: Actualizar personal
 * Acceso: Solo administradores y coordinadores
 * Restricciones: Coordinadores no pueden cambiar estado
 */
exports.updatePersonnel = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden actualizar personal'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { firstName, lastName, email, phone, personnelType, skills, status } = req.body;
    const updateData = {}; // Objeto para almacenar los campos a actualizar

    // Preparar datos a actualizar
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (skills) updateData.skills = skills;
    
    // Validación especial para coordinadores (no pueden cambiar estado)
    if (status) {
      if (req.userRole === 'coordinador') {
        return res.status(403).json({
          success: false,
          message: 'Coordinadores no pueden cambiar el estado del personal'
        });
      }
      updateData.status = status;
    }

    // Validar tipo de personal si se quiere cambiar
    if (personnelType) {
      const personnelTypeExists = await PersonnelType.findById(personnelType);
      if (!personnelTypeExists) {
        return res.status(404).json({
          success: false,
          message: 'El tipo de personal especificado no existe'
        });
      }
      updateData.personnelType = personnelType;
    }

    // Buscar y actualizar el personal
    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    ).populate('personnelType', 'name'); // Poblar solo el nombre del tipo

    // Si no se encuentra el personal
    if (!updatedPersonnel) {
      return res.status(404).json({
        success: false,
        message: 'Personal no encontrado'
      });
    }

    // Respuesta exitosa con los datos actualizados
    res.status(200).json({
      success: true,
      message: 'Personal actualizado exitosamente',
      data: updatedPersonnel
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (email único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe personal con ese email',
        field: 'email'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar personal',
      error: error.message
    });
  }
};

/**
 * Controlador: Eliminar personal
 * Acceso: Solo administradores
 * Validación: No se puede eliminar si está asignado a contratos
 */
exports.deletePersonnel = async (req, res) => {
  try {
    // Validar que el usuario sea administrador
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar personal'
      });
    }

    // Verificar si el personal está asignado a algún contrato
    const contractWithPersonnel = await Contract.findOne({ 
      'personnel.person': req.params.id 
    });
    
    // Prevenir eliminación si está en uso
    if (contractWithPersonnel) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el personal porque está asignado a uno o más contratos'
      });
    }

    // Eliminar el personal
    const deletedPersonnel = await Personnel.findByIdAndDelete(req.params.id);
    
    // Si no se encuentra el personal
    if (!deletedPersonnel) {
      return res.status(404).json({
        success: false,
        message: 'Personal no encontrado'
      });
    }
    
    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Personal eliminado correctamente'
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al eliminar personal',
      error: error.message
    });
  }
};