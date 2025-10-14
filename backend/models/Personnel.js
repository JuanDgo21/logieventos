const mongoose = require('mongoose'); // Importa la librería mongoose

/**
 * ==============================================
 * ESQUEMA: Personnel (Personal)
 * ==============================================
 * Define la estructura del personal en la base de datos
 * con todas sus validaciones y relaciones.
 */
const personnelSchema = new mongoose.Schema({
  // Nombre del miembro del personal
  firstName: {
    type: String, // Tipo String
    required: [true, 'El nombre es obligatorio'], // Campo obligatorio
    trim: true // Elimina espacios en blanco
  },

  // Apellido del miembro del personal
  lastName: {
    type: String, // Tipo String
    required: [true, 'El apellido es obligatorio'], // Campo obligatorio
    trim: true // Elimina espacios en blanco
  },

  // Email del personal (debe ser único)
  email: {
    type: String, // Tipo String
    trim: true, // Elimina espacios en blanco
    lowercase: true, // Convierte a minúsculas automáticamente
    unique: true // Valor único en la colección
  },

  // Teléfono de contacto
  phone: {
    type: String, // Tipo String (para permitir formatos internacionales)
    trim: true // Elimina espacios en blanco
  },

  // Tipo de personal (relación con PersonnelType)
  personnelType: {
    type: mongoose.Schema.Types.ObjectId, // ID de referencia
    ref: 'PersonnelType', // Modelo relacionado
    required: [true, 'El tipo de personal es obligatorio'] // Campo obligatorio
  },

  // Estado actual del personal
  status: {
    type: String, // Tipo String
    enum: [ // Valores permitidos:
      'disponible',  // Disponible para asignación
      'asignado',    // Actualmente asignado a un proyecto
      'vacaciones',  // De vacaciones
      'inactivo'     // No disponible (baja, licencia, etc.)
    ],
    default: 'disponible', // Valor por defecto
    lowercase: true // Convierte cualquier valor en miniscula
  },

  // Habilidades/habilidades del personal
  skills: [{
    type: String, // Cada habilidad es un String
    trim: true // Elimina espacios en blanco
  }]
}, {
  // Opciones adicionales del esquema:
  timestamps: true, // Añade automáticamente createdAt y updatedAt
  versionKey: false // Elimina el campo __v de versionado
});

// Exporta el modelo para su uso en otros archivos
module.exports = mongoose.model('Personnel', personnelSchema);