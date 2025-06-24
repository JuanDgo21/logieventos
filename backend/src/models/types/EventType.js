const moongose = require('mongoose');
const Schema = moongose.Schema;

const EventTypeSchema = new Schema({
  name: {
    type: String,
    required: [true, 'El nombre del tipo de evento es obligatorio'],
    unique: true,
    trim: true
  },
  description: { // descripción
    type: String,
    trim: true
  },
  defaultResources: [{ // recursos predeterminados para este tipo de evento
    resourceType: {
      type: String,
      enum: ['sonido', 'mobiliario', 'catering', 'iluminacion', 'otros'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    defaultQuantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  requiredStaffRoles: [{ // roles de personal requeridos
    role: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  estimatedDuration: { // duración estimada en horas
    type: Number,
    min: 1
    },
  category: {
    type: String,
    enum: ['corporativo', 'social', 'cultural', 'deportivo', 'academico', 'otros']
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualozar la fecha de modificacion al guardar
EventTypeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const EventType = moongose.model('EventType', EventTypeSchema);
module.exports = EventType;