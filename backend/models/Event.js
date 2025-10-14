const mongoose = require('mongoose'); // Importa la librería mongoose

/**
 * ==============================================
 * ESQUEMA: Event (Evento)
 * ==============================================
 * Define la estructura de los eventos en la base de datos
 * con todas sus validaciones y relaciones.
 */
const eventSchema = new mongoose.Schema({
  // Nombre del evento
  name: {
    type: String, // Tipo String
    required: [true, 'El nombre es obligatorio'], // Campo obligatorio con mensaje de error
    trim: true // Elimina espacios en blanco al inicio/final
  },

  // Descripción detallada del evento
  description: {
    type: String, // Tipo String
    required: [true, 'La descripción es obligatoria'], // Campo obligatorio
    trim: true // Elimina espacios en blanco
  },

  // Ubicación física del evento
  location: {
    type: String, // Tipo String
    required: [true, 'La ubicación es obligatoria'], // Campo obligatorio
    trim: true // Elimina espacios en blanco
  },

  // ID de tipo de evento (relación con EventType)
  eventType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventType',
        required: [true, 'El tipo de evento es obligatorio']
  },

  // ID de contrato para la realizacion del evento (relación con Contract)
  contract: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        required: [true, 'El contrato del evento es obligatorio']
  },

  // ID de responsable del evento (relación con User)
  responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El responsable del evento es obligatorio']
  },

  // Fecha y hora de inicio del evento
  startDate: {
    type: Date, // Tipo Date
    required: [true, 'La fecha de inicio es obligatoria'] // Campo obligatorio
  },

  // Fecha y hora de finalización del evento
  endDate: {
    type: Date, // Tipo Date
    required: [true, 'La fecha de fin es obligatoria'] // Campo obligatorio
  },

  // Estado actual del evento
  status: {
    type: String, // Tipo String
    enum: [ // Valores permitidos:
      'planificado',   // Evento programado pero no iniciado
      'en_progreso',   // Evento actualmente en curso
      'completado',    // Evento finalizado con éxito
      'cancelado'      // Evento cancelado
    ],
    default: 'planificado' // Valor por defecto
  },

  // Usuario que creó el evento
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // Referencia a ID
    ref: 'User' // Modelo relacionado
  }
}, {
  // Opciones adicionales del esquema:
  timestamps: true, // Añade automáticamente createdAt y updatedAt
  versionKey: false // Elimina el campo __v de versionado
});

// Exporta el modelo para su uso en otros archivos
module.exports = mongoose.model('Event', eventSchema);