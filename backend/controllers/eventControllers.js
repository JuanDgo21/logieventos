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
    const filter = req.userRole === 'lider' ? { status: { $ne: 'cancelado' } } : {};
    
    // Buscar todos los eventos con sus relaciones
    const events = await Event.find(filter)
      .populate('eventType', 'name category')
      .populate('responsable', 'fullname username') // <-- LÍNEA AÑADIDA Y CORREGIDA
      .populate('contract', 'name')
      .populate('createdBy', 'username')
      .sort({ startDate: 1 });
      
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
      .populate('eventType', 'name description category')
      .populate('responsable', 'fullname username')
      .populate('contract', 'name')
      .populate('createdBy', 'username');
      
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
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
    // CORRECCIÓN APLICADA: Eliminada la variable 'status' de la desestructuración
    const { name, description, location, eventType, contract, responsable, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate || !eventType) {
      return res.status(400).json({ success: false, message: 'Nombre, fechas y tipo de evento son campos obligatorios' });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'La fecha de inicio no puede ser posterior a la fecha de fin' });
    }
    const eventTypeExists = await EventType.findById(eventType);
    if (!eventTypeExists) {
      return res.status(404).json({ success: false, message: 'El tipo de evento especificado no existe' });
    }
    const event = new Event({ name, description, location, eventType, contract, responsable, startDate, endDate, status: 'planificado', createdBy: req.userId });
    const savedEvent = await event.save();
    res.status(201).json({ success: true, message: 'Evento creado exitosamente', data: savedEvent });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe un evento con ese nombre' });
    }
    res.status(500).json({ success: false, message: 'Error al crear evento', error: error.message });
  }
};

/**
 * Controlador: Actualizar evento
 * Acceso: Solo administradores y coordinadores
 */
exports.updateEvent = async (req, res) => {
  try {
    // ... (El código de esta función ya estaba correcto y no necesita cambios)
    const { contract, responsable, eventType } = req.body;
    if (eventType) {
      const eventTypeExists = await EventType.findById(eventType);
      if (!eventTypeExists) return res.status(404).json({ success: false, message: 'El tipo de evento no existe' });
    }
    if (contract) {
      const contractExists = await Contract.findById(contract);
      if (!contractExists) return res.status(404).json({ success: false, message: 'El contrato no existe' });
    }
    if (responsable) {
      const responsableExists = await User.findById(responsable);
      if (!responsableExists) return res.status(404).json({ success: false, message: 'El usuario responsable no existe' });
    }
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    res.status(200).json({ success: true, message: 'Evento actualizado exitosamente', data: updatedEvent });
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    res.status(500).json({ success: false, message: 'Error al actualizar evento', error: error.message });
  }
};


/**
 * Controlador: Eliminar evento
 * Acceso: Solo administradores
 */
exports.deleteEvent = async (req, res) => {
  try {
    // ... (el resto de la función no necesita cambios)
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden eliminar eventos' });
    }
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    res.status(200).json({ success: true, message: 'Evento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar evento', error: error.message });
  }
};