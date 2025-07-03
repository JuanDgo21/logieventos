const Provider = require('../models/Provider');
const ProviderType = require('../models/ProviderType');
const Contract = require('../models/Contract');

/**
 * Controlador: Obtener todos los proveedores
 * Acceso: Todos los roles (pero líderes solo ven proveedores activos)
 */
exports.getAllProviders = async (req, res) => {
  try {
    // Filtro especial para líderes (solo proveedores activos)
    const filter = req.userRole === 'lider' ? { status: 'activo' } : {};
    
    // Buscar todos los proveedores y poblar el tipo de proveedor
    const providers = await Provider.find(filter).populate('providerType', 'name');
    
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

/**
 * Controlador: Obtener proveedor por ID
 * Acceso: Todos los roles (pero líderes solo pueden ver activos)
 */
exports.getProviderById = async (req, res) => {
  try {
    // Buscar proveedor por ID y poblar el tipo de proveedor
    const provider = await Provider.findById(req.params.id)
      .populate('providerType', 'name description');
    
    // Si no se encuentra el proveedor
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Validación especial para líderes (solo pueden ver activos)
    if (req.userRole === 'lider' && provider.status !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este proveedor'
      });
    }
    
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: provider
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

/**
 * Controlador: Crear nuevo proveedor
 * Acceso: Solo administradores y coordinadores
 */
exports.createProvider = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear proveedores'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, contactPerson, email, phone, address, providerType } = req.body;
    
    // Validar campos obligatorios
    if (!name || !email || !providerType) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y tipo de proveedor son campos obligatorios'
      });
    }

    // Verificar que el tipo de proveedor exista
    const providerTypeExists = await ProviderType.findById(providerType);
    if (!providerTypeExists) {
      return res.status(404).json({
        success: false,
        message: 'El tipo de proveedor especificado no existe'
      });
    }

    // Crear nueva instancia del proveedor
    const provider = new Provider({
      name,
      contactPerson,
      email,
      phone,
      address,
      providerType,
      status: 'activo' // Estado por defecto
    });

    // Guardar en la base de datos
    const savedProvider = await provider.save();
    
    // Respuesta exitosa (status 201 - Created)
    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: savedProvider
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (email o nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con ese nombre o email',
        field: error.keyPattern.email ? 'email' : 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

/**
 * Controlador: Actualizar proveedor
 * Acceso: Solo administradores y coordinadores
 * Restricciones: Coordinadores no pueden cambiar estado
 */
exports.updateProvider = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden actualizar proveedores'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, contactPerson, email, phone, address, providerType, status } = req.body;
    const updateData = {};

    // Preparar datos a actualizar
    if (name) updateData.name = name;
    if (contactPerson) updateData.contactPerson = contactPerson;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    
    // Validación especial para coordinadores (no pueden cambiar estado)
    if (status) {
      if (req.userRole === 'coordinador') {
        return res.status(403).json({
          success: false,
          message: 'Coordinadores no pueden cambiar el estado de los proveedores'
        });
      }
      updateData.status = status;
    }

    // Validar tipo de proveedor si se quiere cambiar
    if (providerType) {
      const providerTypeExists = await ProviderType.findById(providerType);
      if (!providerTypeExists) {
        return res.status(404).json({
          success: false,
          message: 'El tipo de proveedor especificado no existe'
        });
      }
      updateData.providerType = providerType;
    }

    // Buscar y actualizar el proveedor
    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    ).populate('providerType', 'name');

    // Si no se encuentra el proveedor
    if (!updatedProvider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Respuesta exitosa con los datos actualizados
    res.status(200).json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: updatedProvider
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (email o nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con ese nombre o email',
        field: error.keyPattern.email ? 'email' : 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

/**
 * Controlador: Eliminar proveedor
 * Acceso: Solo administradores
 * Validación: No se puede eliminar si está en contratos
 */
exports.deleteProvider = async (req, res) => {
  try {
    // Validar que el usuario sea administrador
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar proveedores'
      });
    }

    // Verificar si el proveedor está asignado a algún contrato
    const contractWithProvider = await Contract.findOne({ 
      'providers.provider': req.params.id 
    });
    
    // Prevenir eliminación si el proveedor está en uso
    if (contractWithProvider) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el proveedor porque está asignado a uno o más contratos'
      });
    }

    // Eliminar el proveedor
    const deletedProvider = await Provider.findByIdAndDelete(req.params.id);
    
    // Si no se encuentra el proveedor
    if (!deletedProvider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Proveedor eliminado correctamente'
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};