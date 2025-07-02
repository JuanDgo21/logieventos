const mongoose = require('mongoose'); // Importa la librería mongoose

/**
 * ==============================================
 * ESQUEMA: EventType (Tipo de Evento)
 * ==============================================
 * Define la estructura de los tipos de evento en la base de datos
 * con todas sus validaciones y relaciones.
 */
const eventTypeSchema = new mongoose.Schema({
  // Nombre del tipo de evento (identificador único)
  name: {
    type: String, // Tipo String
    required: true, // Campo obligatorio
    unique: true, // Valor único en la colección
    trim: true // Elimina espacios en blanco al inicio/final
  },

  // Descripción del tipo de evento
  description: {
    type: String, // Tipo String
    trim: true // Elimina espacios en blanco
  },

  // Recursos necesarios predeterminados para este tipo de evento
  defaultResources: [{
    resourceType: {
      type: String, // Tipo String
      enum: ['sonido', 'mobiliario', 'catering', 'iluminacion', 'otros'], // Valores permitidos
      required: true // Campo obligatorio
    },
    description: {
      type: String, // Tipo String
      required: true // Campo obligatorio
    },
    defaultQuantity: {
      type: Number, // Tipo numero
      default: 1, // Lo predeterminado es 1
      min: 1 // El minimo es 1
    }
  }],

  // Tipo de Personal Requerido
  requiredPersonnelType: {
    type: mongoose.Schema.Types.ObjectId, // ID de referencia
    ref: 'PersonnelType', // Modelo relacionado
    required: [true, 'El tipo de personal es obligatorio'] // Campo obligatorio
  },

  // Duracion estimada del tipo de evento
  estimatedDuration: { 
    type: Number, // Tipo numero
    min: 1, // Duración estimada en horas
    max: 24, // Ejemplo: máximo 24 horas
    validate: {
      validator: Number.isInteger, // Valida si el numero es entero
      message: 'La duración debe ser un número entero'
    }
  },

  // Categoría del evento (valores predefinidos)
  category: {
    type: String, // Tipo String
    enum: [ // Valores permitidos:
      'corporativo',  // Eventos empresariales
      'social',       // Eventos sociales
      'cultural',     // Eventos culturales
      'deportivo',    // Eventos deportivos
      'academico'     // Eventos académicos
    ],
    required: true // Campo obligatorio
  },

  // Requisitos para este tipo de evento
  additionalRequirements: {
    type: [String], // Array de strings
    default: [] // Array vacío por defecto
  },

    // Campo createdBy: Referencia al usuario que creó el registro
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // Tipo ObjectId (referencia)
      ref: 'User', // Modelo relacionado (User)
      required: true // Campo obligatorio
    },

  // Estado del tipo de evento (activo/inactivo)
  active: {
    type: Boolean, // Tipo Boolean
    default: true // Valor por defecto: true (activo)
  }

}, { 
  // Opciones adicionales del esquema:
  timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exporta el modelo para su uso en otros archivos
module.exports = mongoose.model('EventType', eventTypeSchema);