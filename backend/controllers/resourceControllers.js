const Resource = require('../models/Resource'); // Modelo de Recursos
const ResourceType = require('../models/ResourceType'); // Modelo de Tipos de Recurso
const Contract = require('../models/Contract'); // Modelo de Contratos

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
    // Parámetros de paginación y filtrado
    const { page = 1, limit = 10, status, resourceType } = req.query;
    const filter = {};
    
    // Aplicar filtros si existen
    if (status) filter.status = status;
    if (resourceType) filter.resourceType = resourceType;

    // Restricción para líderes: solo ven recursos disponibles
    if (req.userRole === 'lider') {
      filter.status = 'disponible';
    }

    // Consulta a la base de datos con paginación y relaciones
    const resources = await Resource.find(filter)
      .populate('resourceType', 'name description category') // Datos básicos del tipo
      .populate('createdBy', 'username email') // Datos del creador
      .populate('lastUpdatedBy', 'username email') // Datos del último editor
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }); // Ordenar por fecha descendente

    // Contar total de documentos para paginación
    const count = await Resource.countDocuments(filter);

    // Respuesta exitosa con datos paginados
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
    // Buscar recurso por ID con relaciones
    const resource = await Resource.findById(req.params.id)
      .populate('resourceType', 'name description category')
      .populate('createdBy', 'username email')
      .populate('lastUpdatedBy', 'username email');

    // Si no existe el recurso
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      });
    }

    // Restricción para líderes: solo pueden ver recursos disponibles
    if (req.userRole === 'lider' && resource.status !== 'disponible') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este recurso'
      });
    }
    
    // Respuesta exitosa
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
    // Validación de rol
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear recursos'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, quantity, cost, resourceType, status } = req.body;
    
    // Validar que el tipo de recurso exista
    const resourceTypeExists = await ResourceType.findById(resourceType);
    if (!resourceTypeExists) {
      return res.status(404).json({
        success: false,
        message: 'El tipo de recurso especificado no existe'
      });
    }

    // Crear nueva instancia del recurso
    const resource = new Resource({
      name,
      description,
      quantity,
      cost,
      resourceType,
      status: status || 'disponible', // Valor por defecto 'disponible'
      createdBy: req.userId // ID del usuario que crea el recurso
    });

    // Guardar en la base de datos
    const savedResource = await resource.save();
    
    // Respuesta exitosa (201 Created)
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
    // Error general del servidor
    res.status(500).json({
      success: false,
      message: 'Error al crear recurso',
      error: error.message
    });
  }
};

/**
 * Controlador: Actualizar recurso existente
 * Acceso: Solo administradores y coordinadores (con restricciones)
 */
exports.updateResource = async (req, res) => {
  try {
    // Validación de rol
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden actualizar recursos'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, quantity, cost, resourceType, status } = req.body;
    const updateData = { lastUpdatedBy: req.userId }; // Siempre actualiza el último editor

    // Construir objeto de actualización
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (quantity) updateData.quantity = quantity;
    if (cost) updateData.cost = cost;
    
    // Restricción: Coordinadores no pueden cambiar el estado
    if (status && req.userRole === 'coordi') {
      return res.status(403).json({
        success: false,
        message: 'Coordinadores no pueden cambiar el estado de los recursos'
      });
    }
    
    if (status) updateData.status = status;

    // Validar tipo de recurso si se quiere cambiar
    if (resourceType) {
      const resourceTypeExists = await ResourceType.findById(resourceType);
      if (!resourceTypeExists) {
        return res.status(404).json({
          success: false,
          message: 'El tipo de recurso especificado no existe'
        });
      }
      updateData.resourceType = resourceType;
    }

    // Buscar y actualizar el recurso
    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    )
    .populate('resourceType', 'name description')
    .populate('createdBy', 'username email')
    .populate('lastUpdatedBy', 'username email');

    // Si no se encuentra el recurso
    if (!updatedResource) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      });
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Recurso actualizado exitosamente',
      data: updatedResource
    });
  } catch (error) {
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
  }
};

/**
 * Controlador: Eliminar recurso
 * Acceso: Solo administradores (con validación adicional)
 */
exports.deleteResource = async (req, res) => {
  try {
    // Validación de rol estricta (solo admin)
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar recursos'
      });
    }

    // Verificar si el recurso está asignado a algún contrato
    const contractWithResource = await Contract.findOne({ 
      'resources.resource': req.params.id 
    });
    
    // Prevenir eliminación si el recurso está en uso
    if (contractWithResource) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el recurso porque está asignado a uno o más contratos'
      });
    }

    // Eliminar el recurso
    const deletedResource = await Resource.findByIdAndDelete(req.params.id);
    
    // Si no se encuentra el recurso
    if (!deletedResource) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      });
    }
    
    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Recurso eliminado correctamente'
    });
  } catch (error) {
    // Error general del servidor
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
    
    // Validar longitud mínima de búsqueda
    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 3 caracteres'
      });
    }

    // Crear filtro de búsqueda (nombre o descripción)
    const filter = {
      $or: [
        { name: { $regex: query, $options: 'i' } }, // Búsqueda case-insensitive
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    // Restricción para líderes: solo recursos disponibles
    if (req.userRole === 'lider') {
      filter.status = 'disponible';
    }

    // Ejecutar búsqueda con límite de resultados
    const resources = await Resource.find(filter)
      .populate('resourceType', 'name') // Solo nombre del tipo
      .limit(10); // Límite de 10 resultados

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    // Error general del servidor
    res.status(500).json({
      success: false,
      message: 'Error al buscar recursos',
      error: error.message
    });
  }
};