const ResourceType = require('../models/ResourceType'); // Importa el modelo ResourceType

/**
 * ==============================================
 * Controlador: Obtener todos los tipos de recurso
 * ==============================================
 * Acceso: Todos los roles pueden acceder
 * Método: GET
 * Ruta: /api/resource-types
 */
exports.getAllResourceTypes = async (req, res) => {
  try {
    // Busca todos los tipos de recurso en la base de datos
    // y popula el campo 'createdBy' con solo 'username' y 'role' del usuario
    const resourceTypes = await ResourceType.find().populate('createdBy', 'username role');
    
    // Respuesta exitosa con status 200 y los datos encontrados
    res.status(200).json({ 
      success: true, 
      data: resourceTypes 
    });
  } catch (error) {
    // Manejo de errores: status 500 para errores del servidor
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener tipos de recurso",
      error: error.message 
    });
  }
};

/**
 * ==============================================
 * Controlador: Obtener tipos de recurso activos
 * ==============================================
 * Acceso: Todos los roles pueden acceder
 * Método: GET
 * Ruta: /api/resource-types/active
 */
exports.getActiveResourceTypes = async (req, res) => {
  try {
    // Busca solo tipos de recurso activos (active: true)
    // y popula el campo 'createdBy' con 'username' y 'role'
    const activeResourceTypes = await ResourceType.find({ active: true })
      .populate('createdBy', 'username role')
      .select('_id name description active'); // Solo devuelve estos campos

    res.status(200).json({ 
      success: true, 
      data: activeResourceTypes 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener tipos de recurso activos",
      error: error.message 
    });
  }
};

/**
 * =================================================
 * Controlador: Obtener tipo de recurso por ID
 * =================================================
 * Acceso: Todos los roles pueden acceder
 * Método: GET
 * Ruta: /api/resource-types/:id
 */
exports.getResourceTypeById = async (req, res) => {
  try {
    // Busca un tipo de recurso por su ID y popula el campo 'createdBy'
    const resourceType = await ResourceType.findById(req.params.id)
      .populate('createdBy', 'username role');
    
    // Si no se encuentra el recurso (resourceType es null)
    if (!resourceType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de recurso no encontrado'
      });
    }
    
    // Respuesta exitosa con los datos del recurso encontrado
    res.status(200).json({
      success: true,
      data: resourceType
    });
  } catch (error) {
    // Manejo de errores generales
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipo de recurso',
      error: error.message
    });
  }
};

/**
 * ==============================================
 * Controlador: Crear tipo de recurso
 * ==============================================
 * Acceso: Solo administradores y coordinadores
 * Método: POST
 * Ruta: /api/resource-types
 * Campos obligatorios: name
 */
exports.createResourceType = async (req, res) => {
  try {
    // Validación de rol: Verifica si el usuario es admin o coordinador
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({ 
        success: false, 
        message: "Solo administradores y coordinadores pueden crear tipos de recurso" 
      });
    }

    // Extrae name y description del cuerpo de la solicitud
    const { name, description } = req.body;
    
    // Validación: El campo name es requerido
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: "Nombre es obligatorio" 
      });
    }

    // Crea una nueva instancia del modelo ResourceType
    const resourceType = new ResourceType({
      name,
      description,
      createdBy: req.userId // Asigna el ID del usuario que hace la solicitud
    });

    // Guarda el nuevo tipo de recurso en la base de datos
    const savedResourceType = await resourceType.save();
    
    // Respuesta exitosa con status 201 (creado)
    res.status(201).json({ 
      success: true, 
      message: "Tipo de recurso creado exitosamente",
      data: savedResourceType 
    });
  } catch (error) {
    // Manejo específico para errores de duplicados (código 11000 de MongoDB)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "El tipo de recurso ya existe",
        field: 'name' // Indica qué campo causó el error
      });
    }
    // Manejo de otros errores
    res.status(500).json({ 
      success: false, 
      message: "Error al crear tipo de recurso",
      error: error.message 
    });
  }
};

/**
 * ==============================================
 * Controlador: Actualizar tipo de recurso
 * ==============================================
 * Acceso: Solo administradores y coordinadores
 * Método: PUT/PATCH
 * Ruta: /api/resource-types/:id
 * Restricciones: 
 * - Coordinadores no pueden cambiar el estado 'active'
 */
exports.updateResourceType = async (req, res) => {
  try {
    // CORRECCIÓN APLICADA: Uso directo de undefined en lugar de typeof
    if (req.userRole === 'coordinador' && req.body.active !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Coordinadores no pueden desactivar tipos de recurso'
      });
    }

    // Extrae los campos que pueden ser actualizados
    const { name, description, active } = req.body;
    const updateData = {}; // Objeto para construir la actualización
    
    // Asigna los nuevos valores solo si están presentes en la solicitud
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    
    // Solo los administradores pueden cambiar el estado 'active'
    // CORRECCIÓN APLICADA: Uso directo de undefined en lugar de typeof
    if (active !== undefined && req.userRole === 'admin') {
      updateData.active = active;
    }

    // Busca y actualiza el recurso en la base de datos
    const updatedResourceType = await ResourceType.findByIdAndUpdate(
      req.params.id, // ID del recurso a actualizar
      updateData,    // Datos a actualizar
      { new: true }  // Opción para devolver el documento actualizado
    ).populate('createdBy', 'username role'); // Poblar datos del creador

    // Si no se encuentra el recurso
    if (!updatedResourceType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de recurso no encontrado'
      });
    }

    // Respuesta exitosa con el recurso actualizado
    res.status(200).json({
      success: true,
      message: 'Tipo de recurso actualizado correctamente',
      data: updatedResourceType
    });
  } catch (error) {
    // Manejo de errores de duplicados (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del tipo de recurso ya existe',
        field: 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipo de recurso',
      error: error.message
    });
  }
};

/**
 * ==============================================
 * Controlador: Eliminar tipo de recurso
 * ==============================================
 * Acceso: Solo administradores
 * Método: DELETE
 * Ruta: /api/resource-types/:id
 */
exports.deleteResourceType = async (req, res) => {
  try {
    // Validación de rol: Solo admin puede eliminar
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar tipos de recurso'
      });
    }

    // Busca y elimina el recurso por su ID
    const deletedResourceType = await ResourceType.findByIdAndDelete(req.params.id);
    
    // Si no se encuentra el recurso
    if (!deletedResourceType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de recurso no encontrado'
      });
    }

    // Respuesta exitosa (sin devolver el documento eliminado)
    res.status(200).json({
      success: true,
      message: 'Tipo de recurso eliminado correctamente'
    });
  } catch (error) {
    // Manejo de errores generales
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de recurso',
      error: error.message
    });
  }
};