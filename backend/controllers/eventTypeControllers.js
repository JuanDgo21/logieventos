const EventType = require('../models/EventType');

/**
 * Controlador: Obtener todos los tipos de evento
 * Acceso: Todos los roles (pero líderes solo ven tipos activos)
 */
exports.getAllEventTypes = async (req, res) => {
  try {
    // Filtro especial para líderes (solo tipos activos)
    const filter = req.userRole === 'lider' ? { active: true } : {};
    
    // Buscar todos los tipos de evento con información del creador
    const eventTypes = await EventType.find(filter)
      .populate('createdBy', 'username role') // Datos básicos del creador
      .sort({ name: 1 }); // Ordenar alfabéticamente por nombre
      
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: eventTypes
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de evento',
      error: error.message
    });
  }
};

/**
 * Controlador: Obtener tipo de evento por ID
 * Acceso: Todos los roles (pero líderes solo pueden ver activos)
 */
exports.getEventTypeById = async (req, res) => {
  try {
    // Buscar tipo de evento por ID con información del creador
    const eventType = await EventType.findById(req.params.id)
      .populate('createdBy', 'username role');
      
    // Si no se encuentra el tipo de evento
    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de evento no encontrado'
      });
    }
    
    // Validación especial para líderes (solo pueden ver tipos activos)
    if (req.userRole === 'lider' && !eventType.active) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este tipo de evento'
      });
    }
    
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: eventType
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipo de evento',
      error: error.message
    });
  }
};

/**
 * Controlador: Crear tipo de evento
 * Acceso: Solo administradores y coordinadores
 */
exports.createEventType = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear tipos de evento'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, defaultResources, requiredPersonnelType, estimatedDuration, category, additionalRequirements, active } = req.body;

    // Validar campos obligatorios
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y categoría son campos obligatorios'
      });
    }

    // Validar que la categoría sea válida
    const validCategories = ['corporativo', 'social', 'cultural', 'deportivo', 'academico'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida',
        validCategories // Enviar lista de categorías válidas
      });
    }

    // Crear nueva instancia del tipo de evento
    const eventType = new EventType({
      name,
      description,
      defaultResources,
      requiredPersonnelType,
      estimatedDuration,
      category,
      additionalRequirements: additionalRequirements || [], // Array vacío si no se especifica
      createdBy: req.userId, // Asignar usuario creador
      active: true // Activo por defecto al crear
    });

    // Guardar en la base de datos
    const savedEventType = await eventType.save();
    
    // Respuesta exitosa (status 201 - Created)
    res.status(201).json({
      success: true,
      message: 'Tipo de evento creado exitosamente',
      data: savedEventType
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del tipo de evento ya existe',
        field: 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al crear tipo de evento',
      error: error.message
    });
  }
};

/**
 * Controlador: Actualizar tipo de evento
 * Acceso: Solo administradores y coordinadores
 * Restricciones: Coordinadores no pueden cambiar estado (active)
 */
exports.updateEventType = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden actualizar tipos de evento'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, defaultResources, requiredPersonnelType, estimatedDuration, category, additionalRequirements, active } = req.body;
    const updateData = {}; // Objeto para almacenar los campos a actualizar
    
    // Preparar datos a actualizar
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (defaultResources) updateData.defaultResources = defaultResources;
    if (requiredPersonnelType) updateData.requiredPersonnelType = requiredPersonnelType;
    if (estimatedDuration) updateData.estimatedDuration = estimatedDuration;
    if (additionalRequirements) updateData.additionalRequirements = additionalRequirements;
    
    // Validación especial para coordinadores (no pueden cambiar estado)
    if (typeof active !== 'undefined') {
      if (req.userRole === 'coordi') {
        return res.status(403).json({
          success: false,
          message: 'Coordinadores no pueden cambiar el estado de los tipos de evento'
        });
      }
      updateData.active = active;
    }

    // Validar categoría si se está actualizando
    if (category) {
      const validCategories = ['corporativo', 'social', 'cultural', 'deportivo', 'academico'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no válida',
          validCategories
        });
      }
      updateData.category = category;
    }

    // Buscar y actualizar el tipo de evento
    const updatedEventType = await EventType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    ).populate('createdBy', 'username role');

    // Si no se encuentra el tipo de evento
    if (!updatedEventType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de evento no encontrado'
      });
    }

    // Respuesta exitosa con los datos actualizados
    res.status(200).json({
      success: true,
      message: 'Tipo de evento actualizado correctamente',
      data: updatedEventType
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del tipo de evento ya existe',
        field: 'name'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipo de evento',
      error: error.message
    });
  }
};

/**
 * Controlador: Eliminar tipo de evento
 * Acceso: Solo administradores
 * Validación: Se debería verificar que no esté en uso (comentado en el código)
 */
exports.deleteEventType = async (req, res) => {
  try {
    // Validar que el usuario sea administrador
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar tipos de evento'
      });
    }

    // Verificar si el tipo de evento está siendo usado en eventos
    // (Implementación pendiente según modelo de Eventos)
    // const eventWithType = await Event.findOne({ eventType: req.params.id });
    // if (eventWithType) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'No se puede eliminar porque está en uso'
    //   });
    // }

    // Eliminar el tipo de evento
    const deletedEventType = await EventType.findByIdAndDelete(req.params.id);
    
    // Si no se encuentra el tipo de evento
    if (!deletedEventType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de evento no encontrado'
      });
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Tipo de evento eliminado correctamente'
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de evento',
      error: error.message
    });
  }
};