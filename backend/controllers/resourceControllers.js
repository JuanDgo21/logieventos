const Resource = require('../models/Resource'); // Modelo de Recursos
const ResourceType = require('../models/ResourceType'); // Modelo de Tipos de Recurso
const Contract = require('../models/Contract'); // Modelo de Contratos

// --- Funciones Auxiliares para updateResource ---

/**
 * Helper 1: Valida los permisos y datos para la actualización de un recurso.
 * Devuelve 'true' si es válido, o envía una respuesta de error y devuelve 'false'.
 */
const validateResourceUpdate = async (req, res) => {
  // Validación 1: Rol de usuario
  if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
    res.status(403).json({
      success: false,
      message: 'Solo administradores y coordinadores pueden actualizar recursos'
    });
    return false; // No es válido
  }

  const { resourceType, status } = req.body;

  // Validación 2: Restricción de 'status' para coordinadores
  if (status && req.userRole === 'coordinador') {
    res.status(403).json({
      success: false,
      message: 'Coordinadores no pueden cambiar el estado de los recursos'
    });
    return false; // No es válido
  }

  // Validación 3: Existencia del Tipo de Recurso (si se cambia)
  if (resourceType) {
    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const resourceTypeExists = await ResourceType.findById(String(resourceType));
    if (!resourceTypeExists) {
      res.status(404).json({
        success: false,
        message: 'El tipo de recurso especificado no existe'
      });
      return false; // No es válido
    }
  }

  return true; // Todas las validaciones pasaron
};

/**
 * Helper 2: Construye el objeto de actualización basado en el body.
 */
const buildResourceUpdateData = (req) => {
  const { name, description, quantity, cost, resourceType, status } = req.body;
  const updateData = { lastUpdatedBy: req.userId }; // Siempre actualiza el último editor

  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (quantity) updateData.quantity = quantity;
  if (cost) updateData.cost = cost;
  if (resourceType) updateData.resourceType = resourceType;
  if (status) updateData.status = status;
  
  return updateData;
};

/**
 * Helper 3: Maneja los errores de 'updateResource'.
 */
const handleResourceUpdateError = (error, res) => {
  // Manejo de errores de duplicado
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Ya existe un recurso con ese nombre',
      field: 'name'
    });
  }
  // Error general del servidor
  res.status(500).json({
    success: false,
    message: 'Error al actualizar recurso',
    error: error.message
  });
};


// --- Controladores (Exports) ---

/**
 * Middleware reusable para verificar roles
 * @param {Array} roles - Lista de roles permitidos
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Rol requerido: ${roles.join(' o ')}`
      });
    }
    next();
  };
};

/**
 * Controlador: Obtener todos los recursos
 * Acceso: Todos los roles (pero líderes solo ven recursos disponibles)
 */
exports.getAllResources = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, resourceType } = req.query;
    const filter = {};
    
    // ✅ CORRECCIÓN (S5147): Forzamos los query params a string
    if (status) filter.status = String(status);
    if (resourceType) filter.resourceType = String(resourceType);

    if (req.userRole === 'lider') {
      filter.status = 'disponible';
    }

    const resources = await Resource.find(filter)
      .populate('resourceType', 'name description category')
      .populate('createdBy', 'username email')
      .populate('lastUpdatedBy', 'username email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }); 

    const count = await Resource.countDocuments(filter);

    res.status(200).json({
      success: true,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener recursos',
      error: error.message
    });
  }
};

/**
 * Controlador: Obtener recurso por ID
 * Acceso: Todos los roles (con restricciones para líderes)
 */
exports.getResourceById = async (req, res) => {
  try {
    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const resource = await Resource.findById(String(req.params.id))
      .populate('resourceType', 'name description category')
      .populate('createdBy', 'username email')
      .populate('lastUpdatedBy', 'username email');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      });
    }

    if (req.userRole === 'lider' && resource.status !== 'disponible') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este recurso'
      });
    }
    
    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener recurso',
      error: error.message
    });
  }
};

/**
 * Controlador: Crear nuevo recurso
 * Acceso: Solo administradores y coordinadores
 */
exports.createResource = async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear recursos'
      });
    }

    const { name, description, quantity, cost, resourceType, status } = req.body;
    
    // ✅ CORRECCIÓN (S5147): Forzamos el ID 'resourceType' a string
    const resourceTypeExists = await ResourceType.findById(String(resourceType));
    if (!resourceTypeExists) {
      return res.status(404).json({
        success: false,
        message: 'El tipo de recurso especificado no existe'
      });
    }

    const resource = new Resource({
      name,
      description,
      quantity,
      cost,
      resourceType,
      status: status || 'disponible',
      createdBy: req.userId
    });

    const savedResource = await resource.save();
    
    res.status(201).json({
      success: true,
      message: 'Recurso creado exitosamente',
      data: savedResource
    });
  } catch (error) {
    // Manejo especial para errores de duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un recurso con ese nombre',
        field: 'name'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear recurso',
      error: error.message
    });
  }
};

/**
 * Controlador: Actualizar recurso existente
 * ✅ REFACTORIZADO (S3776): Lógica extraída a helpers.
 */
exports.updateResource = async (req, res) => {
  try {
    // 1. Validar (Complejidad ahora en el helper)
    const isValid = await validateResourceUpdate(req, res);
    if (!isValid) {
      return; // El helper ya envió la respuesta de error
    }

    // 2. Construir datos (Complejidad ahora en el helper)
    const updateData = buildResourceUpdateData(req);

    // 3. Ejecutar
    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const updatedResource = await Resource.findByIdAndUpdate(
      String(req.params.id),
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    )
    .populate('resourceType', 'name description')
    .populate('createdBy', 'username email')
    .populate('lastUpdatedBy', 'username email');

    // 4. Manejar resultado
    if (!updatedResource) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      });
    }

    // 5. Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Recurso actualizado exitosamente',
      data: updatedResource
    });
  } catch (error) {
    // 6. Manejar errores (Complejidad ahora en el helper)
    handleResourceUpdateError(error, res);
  }
};

/**
 * Controlador: Eliminar recurso
 * Acceso: Solo administradores (con validación adicional)
 */
exports.deleteResource = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar recursos'
      });
    }

    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const contractWithResource = await Contract.findOne({ 
      'resources.resource': String(req.params.id) 
    });
    
    if (contractWithResource) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el recurso porque está asignado a uno o más contratos'
      });
    }

    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const deletedResource = await Resource.findByIdAndDelete(String(req.params.id));
    
    if (!deletedResource) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Recurso eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar recurso',
      error: error.message
    });
  }
};

/**
 * Controlador: Buscar recursos
 * Acceso: Todos los roles (con restricciones para líderes)
 */
exports.searchResources = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 3 caracteres'
      });
    }

    // ✅ CORRECCIÓN (S5147): Forzamos el 'query' del regex a string
    const searchString = String(query);

    const filter = {
      $or: [
        { name: { $regex: searchString, $options: 'i' } },
        { description: { $regex: searchString, $options: 'i' } }
      ]
    };

    if (req.userRole === 'lider') {
      filter.status = 'disponible';
    }

    const resources = await Resource.find(filter)
      .populate('resourceType', 'name')
      .limit(10); 

    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar recursos',
      error: error.message
    });
  }
};