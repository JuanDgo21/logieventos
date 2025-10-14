const mongoose = require('mongoose'); // Importa mongoose para la definición del esquema

/**
 * ==============================================
 * Esquema: ResourceType (Tipo de Recurso)
 * ==============================================
 * Define la estructura de los tipos de recurso en la base de datos
 * y las validaciones correspondientes.
 */
const resourceTypeSchema = new mongoose.Schema({
  // Campo nombre: Identificador único del tipo de recurso
  name: {
    type: String, // Tipo de dato String
    required: [true, 'El nombre es obligatorio'], // Obligatorio con mensaje personalizado
    trim: true // Elimina espacios en blanco al inicio y final
  },
  
  // Campo descripción: Información adicional sobre el tipo de recurso
  description: {
    type: String, // Tipo de dato String
    trim: true // Elimina espacios en blanco al inicio y final
  },
  
  // Campo activo: Estado del tipo de recurso
  active: {
    type: Boolean, // Tipo de dato Boolean
    default: true // Valor por defecto: true (activo)
  },
  
  // Campo creadoPor: Referencia al usuario que creó el registro
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // Tipo ObjectId (referencia)
    ref: 'User', // Referencia al modelo User
    required: true // Campo obligatorio
  }
}, {
  // Opciones adicionales del esquema:
  timestamps: true, // Añade automáticamente createdAt y updatedAt
  versionKey: false // Desactiva el campo __v de versionado
});

/**
 * ==============================================
 * Middleware: Manejo de errores de duplicados
 * ==============================================
 * Intercepta errores de duplicado (código 11000) después de un save()
 * y los transforma en mensajes más amigables.
 */
resourceTypeSchema.post('save', function(error, doc, next) {
  // Verifica si el error es de duplicado (nombre único)
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Ya existe un tipo de recurso con ese nombre')); // Mensaje personalizado
  } else {
    next(error); // Pasa otros errores sin modificar
  }
});

// Exporta el modelo para su uso en otros archivos
module.exports = mongoose.model('ResourceType', resourceTypeSchema);