const mongoose = require('mongoose'); // Importa mongoose para la definición del esquema

/**
 * ==============================================
 * ESQUEMA: Resource (Recurso)
 * ==============================================
 * Define la estructura de los recursos en la base de datos
 * con todas sus validaciones y relaciones.
 */
const resourceSchema = new mongoose.Schema({
  // Nombre del recurso (identificador único)
  name: {
    type: String, // Tipo String
    required: [true, 'El nombre es obligatorio'], // Obligatorio con mensaje de error
    trim: true // Elimina espacios en blanco al inicio/final
  },

  // Descripción detallada del recurso
  description: {
    type: String, // Tipo String
    trim: true // Elimina espacios en blanco
  },

  // Cantidad disponible del recurso
  quantity: {
    type: Number, // Tipo Number
    required: [true, 'La cantidad es obligatoria'], // Campo obligatorio
    min: [0, 'La cantidad no puede ser negativa'] // Valor mínimo 0
  },

  // Costo unitario del recurso
  cost: {
    type: Number, // Tipo Number
    required: [true, 'El costo es obligatorio'], // Campo obligatorio
    min: [0, 'El costo no puede ser negativo'] // Valor mínimo 0
  },

  // Tipo de recurso (relación con ResourceType)
  resourceType: {
    type: mongoose.Schema.Types.ObjectId, // ID de referencia
    ref: 'ResourceType', // Modelo relacionado
    required: [true, 'El tipo de recurso es obligatorio'] // Campo obligatorio
  },

  // Estado actual del recurso
  status: {
    type: String, // Tipo String
    enum: [ // Valores permitidos:
      'disponible',    // Recurso disponible para uso
      'en_uso',       // Recurso actualmente en uso
      'mantenimiento', // Recurso en mantenimiento
      'descartado'    // Recurso descartado/no disponible
    ],
    default: 'disponible' // Valor por defecto
  },

  // Usuario que creó el recurso (relación con User)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // ID de referencia
    ref: 'User', // Modelo relacionado
    required: true // Campo obligatorio
  },

  // Último usuario que actualizó el recurso (relación con User)
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId, // ID de referencia
    ref: 'User' // Modelo relacionado
  }
}, {
  // Opciones adicionales del esquema:
  timestamps: true, // Añade automáticamente createdAt y updatedAt
  versionKey: false // Elimina el campo __v de versionado
});

/**
 * ==============================================
 * MIDDLEWARE: Manejo de errores de duplicados
 * ==============================================
 * Intercepta errores de duplicado (nombre único) después de guardar
 * y transforma el error en un mensaje más legible.
 */
resourceSchema.post('save', function(error, doc, next) {
  // Verifica si el error es de duplicado (código 11000)
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Ya existe un recurso con ese nombre')); // Mensaje personalizado
  } else {
    next(error); // Pasa otros errores sin modificar
  }
});

// Exporta el modelo para su uso en otros archivos
module.exports = mongoose.model('Resource', resourceSchema);