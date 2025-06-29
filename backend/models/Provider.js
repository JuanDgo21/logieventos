const mongoose = require('mongoose'); // Importa la librería mongoose

/**
 * ==============================================
 * ESQUEMA: Provider (Proveedor)
 * ==============================================
 * Define la estructura de los proveedores en la base de datos
 * con todas sus validaciones y relaciones.
 */
const providerSchema = new mongoose.Schema({
  // Nombre del proveedor (razón social)
  name: {
    type: String, // Tipo String
    required: [true, 'El nombre es obligatorio'], // Campo obligatorio con mensaje de error
    trim: true // Elimina espacios en blanco al inicio/final
  },

  // Persona de contacto en el proveedor
  contactPerson: {
    type: String, // Tipo String
    trim: true // Elimina espacios en blanco
  },

  // Correo electrónico del proveedor
  email: {
    type: String, // Tipo String
    trim: true, // Elimina espacios en blanco
    lowercase: true // Convierte a minúsculas automáticamente
  },

  // Teléfono de contacto
  phone: {
    type: String, // Tipo String
    trim: true // Elimina espacios en blanco
  },

  // Dirección física del proveedor
  address: {
    type: String, // Tipo String
    trim: true // Elimina espacios en blanco
  },

  // Tipo de proveedor (relación con ProviderType)
  providerType: {
    type: mongoose.Schema.Types.ObjectId, // ID de referencia
    ref: 'ProviderType', // Modelo relacionado
    required: [true, 'El tipo de proveedor es obligatorio'] // Campo obligatorio
  },

  // Estado del proveedor
  status: {
    type: String, // Tipo String
    enum: [ // Valores permitidos:
      'activo',     // Proveedor activo y disponible
      'inactivo',   // Proveedor no disponible temporalmente
      'suspendido'  // Proveedor suspendido por incumplimientos
    ],
    default: 'activo' // Valor por defecto
  }
}, {
  // Opciones adicionales del esquema:
  timestamps: true, // Añade automáticamente createdAt y updatedAt
  versionKey: false // Elimina el campo __v de versionado
});

// Exporta el modelo para su uso en otros archivos
module.exports = mongoose.model('Provider', providerSchema);