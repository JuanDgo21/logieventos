const PersonnelType = require('../models/PersonnelType');
const Contract = require('../models/Contract');

/**
 * Controlador: Obtener todos los tipos de personal
 * Acceso: Todos los roles (pero líderes solo ven tipos activos)
 */
exports.getAllPersonnelTypes = async (req, res) => {
  try {
    // Filtro especial para líderes (solo tipos activos)
    const filter = req.userRole === 'lider' ? { isActive: true } : {};
    
    // Buscar todos los tipos de personal con información de creador y actualizador
    const personnelTypes = await PersonnelType.find(filter)
      .populate('createdBy', 'username role') // Datos del creador
      .populate('updatedBy', 'username role'); // Datos del último que actualizó
      
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: personnelTypes
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de personal',
      error: error.message
    });
  }
};

/**
 * Controlador: Obtener tipo de personal por ID
 * Acceso: Todos los roles (pero líderes solo pueden ver activos)
 */
exports.getPersonnelTypeById = async (req, res) => {
  try {
    // Buscar tipo de personal por ID con información de creador y actualizador
    const personnelType = await PersonnelType.findById(req.params.id)
      .populate('createdBy', 'username role')
      .populate('updatedBy', 'username role');
    
    // Si no se encuentra el tipo de personal
    if (!personnelType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de personal no encontrado'
      });
    }
    
    // Validación especial para líderes (solo pueden ver tipos activos)
    if (req.userRole === 'lider' && !personnelType.isActive) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este tipo de personal'
      });
    }
    
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: personnelType
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipo de personal',
      error: error.message
    });
  }
};

/**
 * Controlador: Crear tipo de personal
 * Acceso: Solo administradores y coordinadores
 */
exports.createPersonnelType = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear tipos de personal'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, rate } = req.body;

    // Validar campos obligatorios
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y tarifa son campos obligatorios'
      });
    }

    // Crear nueva instancia del tipo de personal
    const personnelType = new PersonnelType({
      name,
      description,
      rate,
      createdBy: req.userId, // Asignar usuario creador
      isActive: true // Activo por defecto al crear
    });

    // Guardar en la base de datos
    const savedPersonnelType = await personnelType.save();
    
    // Respuesta exitosa (status 201 - Created)
    res.status(201).json({
      success: true,
      message: 'Tipo de personal creado exitosamente',
      data: savedPersonnelType
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del tipo de personal ya existe',
        field: 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al crear tipo de personal',
      error: error.message
    });
  }
};

/**
 * Controlador: Actualizar tipo de personal
 * Acceso: Solo administradores y coordinadores
 * Restricciones: Coordinadores no pueden cambiar estado (isActive)
 */
exports.updatePersonnelType = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden actualizar tipos de personal'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, rate, isActive } = req.body;
    const updateData = { 
      updatedBy: req.userId // Registrar quién realizó la actualización
    };
    
    // Preparar datos a actualizar
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (rate) updateData.rate = rate;
    
    // Validación especial para coordinadores (no pueden cambiar estado)
    if (typeof isActive !== 'undefined') {
      if (req.userRole === 'coordinador') {
        return res.status(403).json({
          success: false,
          message: 'Coordinadores no pueden cambiar el estado de los tipos de personal'
        });
      }
      updateData.isActive = isActive;
    }

    // Buscar y actualizar el tipo de personal
    const updatedPersonnelType = await PersonnelType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    )
    .populate('createdBy updatedBy', 'username role'); // Poblar datos de creador y actualizador

    // Si no se encuentra el tipo de personal
    if (!updatedPersonnelType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de personal no encontrado'
      });
    }

    // Respuesta exitosa con los datos actualizados
    res.status(200).json({
      success: true,
      message: 'Tipo de personal actualizado correctamente',
      data: updatedPersonnelType
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del tipo de personal ya existe',
        field: 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipo de personal',
      error: error.message
    });
  }
};

/**
 * Controlador: Eliminar tipo de personal
 * Acceso: Solo administradores
 * Validación: No se puede eliminar si está siendo usado en contratos
 */
exports.deletePersonnelType = async (req, res) => {
  try {
    // Validar que el usuario sea administrador
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar tipos de personal'
      });
    }

    // Verificar si el tipo de personal está asignado a algún contrato
    const contractWithPersonnelType = await Contract.findOne({
      'personnel.type': req.params.id
    });
    
    // Prevenir eliminación si está en uso
    if (contractWithPersonnelType) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el tipo de personal porque está asignado a uno o más contratos'
      });
    }

    // Eliminar el tipo de personal
    const deletedPersonnelType = await PersonnelType.findByIdAndDelete(req.params.id);
    
    // Si no se encuentra el tipo de personal
    if (!deletedPersonnelType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de personal no encontrado'
      });
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Tipo de personal eliminado correctamente'
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de personal',
      error: error.message
    });
  }
};