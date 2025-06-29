// Importar mongoose para la definición del esquema y modelo
const mongoose = require('mongoose');

// Definición del esquema de Contrato
const contractSchema = new mongoose.Schema({
  // Referencia al evento asociado al contrato (obligatorio)
  event: {
    type: mongoose.Schema.Types.ObjectId,  // Tipo ObjectId para referencia
    ref: 'Event',                          // Referencia al modelo Event
    required: [true, 'El evento es obligatorio']  // Validación de requerido
  },

  // Nombre del cliente (obligatorio)
  clientName: {
    type: String,
    required: [true, 'El nombre del cliente es obligatorio'],
    trim: true  // Elimina espacios en blanco al inicio y final
  },

  // Contacto del cliente
  clientContact: {
    type: String,
    trim: true  // Elimina espacios en blanco
  },

  // Email del cliente
  clientEmail: {
    type: String,
    trim: true,
    lowercase: true  // Convierte el email a minúsculas automáticamente
  },

  // Fecha de inicio del contrato (obligatoria)
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es obligatoria']
  },

  // Fecha de fin del contrato (obligatoria)
  endDate: {
    type: Date,
    required: [true, 'La fecha de fin es obligatoria']
  },

  // Monto total del contrato
  totalAmount: {
    type: Number,
    min: [0, 'El monto total no puede ser negativo']  // Validación de valor mínimo
  },

  // Estado del contrato con valores predefinidos
  status: {
    type: String,
    enum: ['borrador', 'activo', 'completado', 'cancelado'],  // Valores permitidos
    default: 'borrador'  // Valor por defecto
  },

  // Términos y condiciones del contrato
  terms: {
    type: String,
    trim: true  // Elimina espacios en blanco
  },

  // Array de recursos asociados al contrato
  resources: [{
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'  // Referencia al modelo Resource
    },
    quantity: {
      type: Number,
      min: [1, 'La cantidad debe ser al menos 1']  // Validación de cantidad mínima
    }
  }],

  // Array de proveedores asociados al contrato
  providers: [{
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider'  // Referencia al modelo Provider
    },
    serviceDescription: {
      type: String,
      trim: true  // Elimina espacios en blanco
    },
    cost: {
      type: Number,
      min: [0, 'El costo no puede ser negativo']  // Validación de costo mínimo
    }
  }],

  // Array de personal asociado al contrato
  personnel: [{
    person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personnel'  // Referencia al modelo Personnel
    },
    role: {
      type: String,
      trim: true  // Elimina espacios en blanco
    },
    hours: {
      type: Number,
      min: [0, 'Las horas no pueden ser negativas']  // Validación de horas mínimas
    }
  }],

  // Usuario que creó el contrato
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Referencia al modelo User
  }
}, {
  // Opciones adicionales del esquema
  timestamps: true,    // Habilita createdAt y updatedAt automáticos
  versionKey: false   // Deshabilita el campo __v de versionado
});

// Exportar el modelo Contract basado en el esquema definido
module.exports = mongoose.model('Contract', contractSchema);