const Personnel = require('../models/Personnel');
const PersonnelType = require('../models/PersonnelType');
const Contract = require('../models/Contract');

/**
 * Controlador: Obtener todos el personal
 * Acceso: Todos los roles (pero líderes solo ven personal activo)
 */
exports.getAllPersonnel = async (req, res) => {
  try {
    // Filtro especial para líderes (solo personal disponible)
    const filter = req.userRole === 'lider' ? { status: 'disponible' } : {};
    
    // Buscar todos el personal con su tipo de personal asociado
    // Esta consulta es segura, no usa input directo del usuario en el filtro.
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
    // ✅ CORRECCIÓN: Forzamos el ID a string
    const person = await Personnel.findById(String(req.params.id))
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
    // ✅ CORRECCIÓN: Forzamos el ID 'personnelType' a string
    const personnelTypeExists = await PersonnelType.findById(String(personnelType));
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

// Función auxiliar para validar permisos de actualización
const validateUpdatePermissions = (userRole, status) => {
  if (status && userRole === 'coordinador') {
    return {
      allowed: false,
      message: 'Coordinadores no pueden cambiar el estado del personal'
    };
  }
  return { allowed: true };
};

// Función auxiliar para preparar datos de actualización
const preparePersonnelUpdateData = (body) => {
  const { firstName, lastName, email, phone, skills, status } = body;
  const updateData = {};
  
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (skills) updateData.skills = skills;
  if (status) updateData.status = status;
  
  return updateData;
};

// Función auxiliar para validar tipo de personal
const validatePersonnelType = async (personnelType) => {
  if (!personnelType) return { valid: true };
  
  const personnelTypeExists = await PersonnelType.findById(String(personnelType));
  if (!personnelTypeExists) {
    return {
      valid: false,
      message: 'El tipo de personal especificado no existe'
    };
  }
  return { valid: true };
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

    // Validar permisos para cambio de estado
    const permissionCheck = validateUpdatePermissions(req.userRole, req.body.status);
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: permissionCheck.message
      });
    }

    // Preparar datos a actualizar
    const updateData = preparePersonnelUpdateData(req.body);

    // Validar tipo de personal si se quiere cambiar
    const personnelTypeValidation = await validatePersonnelType(req.body.personnelType);
    if (!personnelTypeValidation.valid) {
      return res.status(404).json({
        success: false,
        message: personnelTypeValidation.message
      });
    }
    
    if (req.body.personnelType) {
      updateData.personnelType = req.body.personnelType;
    }

    // Buscar y actualizar el personal
    // ✅ CORRECCIÓN: Forzamos el ID a string
    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      String(req.params.id),
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
    // ✅ CORRECCIÓN: Forzamos el ID a string
    const contractWithPersonnel = await Contract.findOne({ 
      'personnel.person': String(req.params.id) 
    });
    
    // Prevenir eliminación si está en uso
    if (contractWithPersonnel) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el personal porque está asignado a uno o más contratos'
      });
    }

    // Eliminar el personal
    // ✅ CORRECCIÓN: Forzamos el ID a string
    const deletedPersonnel = await Personnel.findByIdAndDelete(String(req.params.id));
    
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