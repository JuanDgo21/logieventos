const mongoose = require('mongoose'); // Importa la librería mongoose para interactuar con MongoDB

/**
 * ==============================================
 * ESQUEMA: PersonnelType (Tipo de Personal)
 * ==============================================
 * Define la estructura de los tipos de personal en la base de datos
 * con todas sus validaciones, relaciones y configuraciones.
 */
const personnelTypeSchema = new mongoose.Schema({
  // Campo nombre: Identificador único del tipo de personal
  name: {
    type: String, // Tipo de dato String
    required: [true, 'El nombre es obligatorio'], // Campo obligatorio con mensaje de error
    unique: true, // Valor único en la colección (no se permiten duplicados)
    trim: true, // Elimina espacios en blanco al inicio y final
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'], // Longitud mínima
    maxlength: [50, 'El nombre no puede exceder 50 caracteres'] // Longitud máxima
  },

  // Campo descripción: Información adicional sobre el tipo de personal
  description: {
    type: String, // Tipo de dato String
    trim: true, // Elimina espacios en blanco
    maxlength: [200, 'La descripción no puede exceder 200 caracteres'] // Longitud máxima
  },

  // Campo isActive: Estado del tipo de personal (activo/inactivo)
  isActive: {
    type: Boolean, // Tipo de dato Boolean
    default: true // Valor por defecto: true (activo)
  },

  // Campo createdBy: Referencia al usuario que creó el registro
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // Tipo ObjectId (referencia)
    ref: 'User', // Modelo relacionado (User)
    required: true // Campo obligatorio
  },

  // Campo updatedBy: Referencia al último usuario que actualizó el registro
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId, // Tipo ObjectId (referencia)
    ref: 'User' // Modelo relacionado (User)
  }
}, {
  // Opciones adicionales del esquema:
  timestamps: true, // Añade automáticamente campos createdAt y updatedAt
  versionKey: false // Elimina el campo __v de versionado
});

/**
 * ==============================================
 * MIDDLEWARE: Manejo de errores de duplicados
 * ==============================================
 * Intercepta errores de duplicado (nombre único) después de guardar
 * y transforma el error en un mensaje más amigable.
 */
personnelTypeSchema.post('save', function(error, doc, next) {
  // Verifica si el error es de duplicado (código 11000 de MongoDB)
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Ya existe un tipo de personal con ese nombre')); // Mensaje personalizado
  } else {
    next(error); // Pasa otros errores sin modificar
  }
});

// Exporta el modelo para su uso en otros archivos
module.exports = mongoose.model('PersonnelType', personnelTypeSchema);