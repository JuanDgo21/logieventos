const Provider = require('../models/Provider');
const ProviderType = require('../models/ProviderType');
const Contract = require('../models/Contract');

// --- Funciones Auxiliares para updateProvider ---

/**
 * Helper 1: Valida los permisos y datos para la actualización.
 * Devuelve 'true' si es válido, o envía una respuesta de error y devuelve 'false'.
 */
const validateUpdatePermissions = async (req, res) => {
  const { status, providerType } = req.body;

  // Validación 1: Rol de usuario
  if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
    res.status(403).json({
      success: false,
      message: 'Solo administradores y coordinadores pueden actualizar proveedores'
    });
    return false; // No es válido
  }

  // Validación 2: Permiso para cambiar estado
  if (status && req.userRole === 'coordinador') {
    res.status(403).json({
      success: false,
      message: 'Coordinadores no pueden cambiar el estado de los proveedores'
    });
    return false; // No es válido
  }

  // Validación 3: Existencia del Tipo de Proveedor (si se cambia)
  if (providerType) {
    // ✅ CORRECCIÓN (S5147): Forzamos el ID 'providerType' a string
    const providerTypeExists = await ProviderType.findById(String(providerType));
    if (!providerTypeExists) {
      res.status(404).json({
        success: false,
        message: 'El tipo de proveedor especificado no existe'
      });
      return false; // No es válido
    }
  }

  return true; // Todas las validaciones pasaron
};

/**
 * Helper 2: Construye el objeto de actualización basado en el body.
 */
const buildUpdateData = (body) => {
  const { name, contactPerson, email, phone, address, providerType, status } = body;
  const updateData = {};

  if (name) updateData.name = name;
  if (contactPerson) updateData.contactPerson = contactPerson;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (providerType) updateData.providerType = providerType;
  if (status) updateData.status = status;
  
  return updateData;
};

/**
 * Helper 3: Maneja los errores del bloque catch.
 */
const handleProviderError = (error, res) => {
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
};


// --- Controladores (Exports) ---

/**
 * Controlador: Obtener todos los proveedores
 */
exports.getAllProviders = async (req, res) => {
  try {
    const filter = req.userRole === 'lider' ? { status: 'activo' } : {};
    const providers = await Provider.find(filter).populate('providerType', 'name');
    
    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

/**
 * Controlador: Obtener proveedor por ID
 */
exports.getProviderById = async (req, res) => {
  try {
    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const provider = await Provider.findById(String(req.params.id))
      .populate('providerType', 'name description');
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    if (req.userRole === 'lider' && provider.status !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este proveedor'
      });
    }
    
    res.status(200).json({
      success: true,
      data: provider
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

/**
 * Controlador: Crear nuevo proveedor
 */
exports.createProvider = async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear proveedores'
      });
    }

    const { name, contactPerson, email, phone, address, providerType } = req.body;
    
    if (!name || !email || !providerType) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y tipo de proveedor son campos obligatorios'
      });
    }

    // ✅ CORRECCIÓN (S5147): Forzamos el ID 'providerType' a string
    const providerTypeExists = await ProviderType.findById(String(providerType));
    if (!providerTypeExists) {
      return res.status(404).json({
        success: false,
        message: 'El tipo de proveedor especificado no existe'
      });
    }

    const provider = new Provider({
      name,
      contactPerson,
      email,
      phone,
      address,
      providerType,
      status: 'activo'
    });

    const savedProvider = await provider.save();
    
    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: savedProvider
    });
  } catch (error) {
    // Usamos el helper de errores aquí también para consistencia
    handleProviderError(error, res);
  }
};

/**
 * Controlador: Actualizar proveedor
 * ✅ REFACTORIZADO (S3776): Lógica extraída a helpers.
 */
exports.updateProvider = async (req, res) => {
  try {
    // 1. Validar (Complejidad ahora en el helper)
    const isValid = await validateUpdatePermissions(req, res);
    if (!isValid) {
      return; // El helper ya envió la respuesta de error
    }

    // 2. Construir datos (Complejidad ahora en el helper)
    const updateData = buildUpdateData(req.body);

    // 3. Ejecutar
    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const updatedProvider = await Provider.findByIdAndUpdate(
      String(req.params.id),
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    ).populate('providerType', 'name');

    // 4. Manejar resultado
    if (!updatedProvider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // 5. Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: updatedProvider
    });

  } catch (error) {
    // 6. Manejar errores (Complejidad ahora en el helper)
    handleProviderError(error, res);
  }
};

/**
 * Controlador: Eliminar proveedor
 */
exports.deleteProvider = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar proveedores'
      });
    }

    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const contractWithProvider = await Contract.findOne({ 
      'providers.provider': String(req.params.id) 
    });
    
    if (contractWithProvider) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el proveedor porque está asignado a uno o más contratos'
      });
    }

    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const deletedProvider = await Provider.findByIdAndDelete(String(req.params.id));
    
    if (!deletedProvider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Proveedor eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};