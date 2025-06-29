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
  requirements: {
    type: [String], // Array de strings
    default: [] // Array vacío por defecto
  },

  // Estado del tipo de evento (activo/inactivo)
  active: {
    type: Boolean, // Tipo Boolean
    default: true // Valor por defecto: true (activo)
  },

  // Usuario que creó el tipo de evento
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // Referencia a ID
    ref: 'User', // Modelo relacionado (User)
    required: true // Campo obligatorio
  }
}, { 
  // Opciones adicionales del esquema:
  timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exporta el modelo para su uso en otros archivos
module.exports = mongoose.model('EventType', eventTypeSchema);