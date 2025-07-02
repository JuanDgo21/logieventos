const ProviderType = require('../models/ProviderType'); // Importa el modelo ProviderType

/**
 * Controlador: Obtener todos los tipos de proveedor
 * Acceso: Todos los roles (pero líderes solo ven tipos activos)
 */
exports.getAllProviderTypes = async (req, res) => {
  try {
    // Filtro especial para líderes (solo tipos activos)
    const filter = req.userRole === 'lider' ? { isActive: true } : {};
    
    // Buscar todos los tipos de proveedor y poblar datos del creador
    const providerTypes = await ProviderType.find(filter)
      .populate('createdBy', 'username role');
    
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: providerTypes
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de proveedor',
      error: error.message
    });
  }
};

/**
 * Controlador: Obtener tipo de proveedor por ID
 * Acceso: Todos los roles (pero líderes solo pueden ver activos)
 */
exports.getProviderTypeById = async (req, res) => {
  try {
    // Buscar tipo de proveedor por ID y poblar datos del creador
    const providerType = await ProviderType.findById(req.params.id)
      .populate('createdBy', 'username role');
    
    // Si no se encuentra el tipo de proveedor
    if (!providerType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de proveedor no encontrado'
      });
    }
    
    // Validación especial para líderes (solo pueden ver activos)
    if (req.userRole === 'lider' && !providerType.isActive) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este tipo de proveedor'
      });
    }
    
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: providerType
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipo de proveedor',
      error: error.message
    });
  }
};

/**
 * Controlador: Crear tipo de proveedor
 * Acceso: Solo administradores y coordinadores
 */
exports.createProviderType = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear tipos de proveedor'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description } = req.body;

    // Validar campo obligatorio
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }

    // Crear nueva instancia del tipo de proveedor
    const providerType = new ProviderType({
      name,
      description,
      createdBy: req.userId // Asignar usuario creador
    });

    // Guardar en la base de datos
    const savedProviderType = await providerType.save();
    
    // Respuesta exitosa (status 201 - Created)
    res.status(201).json({
      success: true,
      message: 'Tipo de proveedor creado exitosamente',
      data: savedProviderType
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del tipo de proveedor ya existe',
        field: 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al crear tipo de proveedor',
      error: error.message
    });
  }
};

/**
 * Controlador: Actualizar tipo de proveedor
 * Acceso: Solo administradores y coordinadores
 * Restricciones: Coordinadores no pueden cambiar estado (isActive)
 */
exports.updateProviderType = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden actualizar tipos de proveedor'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, isActive } = req.body;
    const updateData = { updatedBy: req.userId }; // Registrar quién actualizó
    
    // Preparar datos a actualizar
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    
    // Validación especial para coordinadores (no pueden cambiar estado)
    if (typeof isActive !== 'undefined') {
      if (req.userRole === 'coordinador') {
        return res.status(403).json({
          success: false,
          message: 'Coordinadores no pueden cambiar el estado de los tipos de proveedor'
        });
      }
      updateData.isActive = isActive;
    }

    // Buscar y actualizar el documento
    const updatedProviderType = await ProviderType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    ).populate('createdBy', 'username role');

    // Si no se encuentra el tipo de proveedor
    if (!updatedProviderType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de proveedor no encontrado'
      });
    }

    // Respuesta exitosa con los datos actualizados
    res.status(200).json({
      success: true,
      message: 'Tipo de proveedor actualizado correctamente',
      data: updatedProviderType
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del tipo de proveedor ya existe',
        field: 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipo de proveedor',
      error: error.message
    });
  }
};

/**
 * Controlador: Eliminar tipo de proveedor
 * Acceso: Solo administradores
 */
exports.deleteProviderType = async (req, res) => {
  try {
    // Validar que el usuario sea administrador
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar tipos de proveedor'
      });
    }

    // Buscar y eliminar el tipo de proveedor
    const deletedProviderType = await ProviderType.findByIdAndDelete(req.params.id);
    
    // Si no se encuentra el tipo de proveedor
    if (!deletedProviderType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de proveedor no encontrado'
      });
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Tipo de proveedor eliminado correctamente'
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de proveedor',
      error: error.message
    });
  }
};