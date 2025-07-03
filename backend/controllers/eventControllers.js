const Event = require('../models/Event');
const EventType = require('../models/EventType');
const Contract = require('../models/Contract');
const User = require('../models/User');

/**
 * Controlador: Obtener todos los eventos
 * Acceso: Todos los roles (pero líderes solo ven eventos activos)
 */
exports.getAllEvents = async (req, res) => {
  try {
    // // Filtro especial para líderes (solo eventos planificados)
   const filter = req.userRole === 'lider' ? { status: { $ne: 'cancelado' } } : {};
    
    // Buscar todos los eventos con sus relaciones
    const events = await Event.find(filter)
      .populate('eventType', 'name category') // Datos básicos del tipo de evento
      .populate('createdBy', 'username') // Datos del creador
      .sort({ startDate: 1 }); // Ordenar por fecha de inicio ascendente
      
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos',
      error: error.message
    });
  }
};

/**
 * Controlador: Obtener evento por ID
 * Acceso: Todos los roles (pero líderes solo pueden ver activos)
 */
exports.getEventById = async (req, res) => {
  try {
    // Buscar evento por ID con sus relaciones
    const event = await Event.findById(req.params.id)
      .populate('eventType', 'name description category') // Datos completos del tipo
      .populate('createdBy', 'username'); // Datos del creador
      
    // Si no se encuentra el evento
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    // Validación especial para líderes (solo pueden ver eventos activos)
    // if (req.userRole === 'lider' && event.status !== 'activo') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'No tienes permiso para ver este evento'
    //   });
    // }
    
    // Respuesta exitosa con los datos encontrados
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento',
      error: error.message
    });
  }
};

/**
 * Controlador: Crear nuevo evento
 * Acceso: Solo administradores y coordinadores
 */
exports.createEvent = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden crear eventos'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, location, eventType, contract, responsable, startDate, endDate, status, createdBy } = req.body;
    
    // Validar campos obligatorios
    if (!name || !startDate || !endDate || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, fechas y tipo de evento son campos obligatorios'
      });
    }

    // Validar que las fechas sean coherentes
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin'
      });
    }

    // Verificar que el tipo de evento exista
    const eventTypeExists = await EventType.findById(eventType);
    if (!eventTypeExists) {
      return res.status(404).json({
        success: false,
        message: 'El tipo de evento especificado no existe'
      });
    }

    // Crear nueva instancia del evento
    const event = new Event({
      name,
      description,
      location,
      eventType,
      contract,
      responsable,
      startDate,
      endDate,
      status: 'planificado', // Estado por defecto
      createdBy: req.userId // Asignar usuario creador
    });

    // Guardar en la base de datos
    const savedEvent = await event.save();
    
    // Respuesta exitosa (status 201 - Created)
    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: savedEvent
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un evento con ese nombre'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al crear evento',
      error: error.message
    });
  }
};

/**
 * Controlador: Actualizar evento
 * Acceso: Solo administradores y coordinadores
 * Restricciones: Coordinadores no pueden cambiar estado
 */
exports.updateEvent = async (req, res) => {
  try {
    // Validar rol del usuario
    if (req.userRole !== 'admin' && req.userRole !== 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores y coordinadores pueden actualizar eventos'
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const { name, description, location, eventType, contract, responsable, startDate, endDate, status, createdBy } = req.body;
    const updateData = {}; // Objeto para almacenar los campos a actualizar
    
    // Preparar datos a actualizar
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (location) updateData.location = location;
    
    // Validación especial para coordinadores (no pueden cambiar estado)
    if (status) {
      if (req.userRole === 'coordi') {
        return res.status(403).json({
          success: false,
          message: 'Coordinadores no pueden cambiar el estado de los eventos'
        });
      }
      updateData.status = status;
    }

    // Validar fechas si se están actualizando
    if (startDate || endDate) {
      const currentEvent = await Event.findById(req.params.id);
      const newStartDate = startDate ? new Date(startDate) : currentEvent.startDate;
      const newEndDate = endDate ? new Date(endDate) : currentEvent.endDate;
      
      // Validar coherencia entre fechas
      if (newStartDate > newEndDate) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio no puede ser posterior a la fecha de fin'
        });
      }
      
      // Asignar fechas validadas
      if (startDate) updateData.startDate = startDate;
      if (endDate) updateData.endDate = endDate;
    }

    // Validar tipo de evento si se está actualizando
    if (eventType) {
      const eventTypeExists = await EventType.findById(eventType);
      if (!eventTypeExists) {
        return res.status(404).json({
          success: false,
          message: 'El tipo de evento especificado no existe'
        });
      }
      updateData.eventType = eventType;
    }

    // Validar contrato si se está actualizando
    if (contract) {
      const contractExists = await contract.findById(Contract);
      if (!contractExists) {
        return res.status(404).json({
          success: false,
          message: 'El contrato especificado no existe'
        });
      }
      updateData.contract = contract;
    }

    // Validar tipo de evento si se está actualizando
    if (responsable) {
      const responsableExists = await responsable.findById(User);
      if (!responsableExists) {
        return res.status(404).json({
          success: false,
          message: 'El usuario especificado no existe'
        });
      }
      updateData.responsable = responsable;
    }


    // Buscar y actualizar el evento
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Devuelve el documento actualizado
        runValidators: true // Ejecuta validaciones del esquema
      }
    )
    .populate('eventType', 'name') // Poblar datos básicos del tipo
    .populate('createdBy', 'username'); // Poblar datos del creador

    // Si no se encuentra el evento
    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Respuesta exitosa con los datos actualizados
    res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: updatedEvent
    });
  } catch (error) {
    // Manejo especial para errores de duplicado (nombre único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un evento con ese nombre'
      });
    }
    // Manejo de otros errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar evento',
      error: error.message
    });
  }
};

/**
 * Controlador: Eliminar evento
 * Acceso: Solo administradores
 * Validación: Se debería verificar que no tenga recursos asignados (comentado)
 */
exports.deleteEvent = async (req, res) => {
  try {
    // Validar que el usuario sea administrador
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar eventos'
      });
    }

    // Verificar si el evento tiene recursos asignados
    // (Implementación pendiente según modelo de asignaciones)
    // const eventHasResources = await ResourceAssignment.findOne({ event: req.params.id });
    // if (eventHasResources) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'No se puede eliminar porque tiene recursos asignados'
    //   });
    // }

    // Eliminar el evento
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    
    // Si no se encuentra el evento
    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Evento eliminado correctamente'
    });
  } catch (error) {
    // Manejo de errores del servidor
    res.status(500).json({
      success: false,
      message: 'Error al eliminar evento',
      error: error.message
    });
  }
};