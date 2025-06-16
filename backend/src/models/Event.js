const moongose = require('mongoose');
const Schema = moongose.Schema;

const EventSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre del evento es obligatorio'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La descripción del evento es obligatoria'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'El lugar del evento es obligatorio'],
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'La fecha de inicio del evento es obligatoria']
    },
    endDate: {
        type: Date,
        required: [true, 'La fecha de fin del evento es obligatoria'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        }
    },
    responsable: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El responsable del evento es obligatorio']
    },
    status: {
        type: String,
    enum: ['planificado', 'confirmado', 'en_progreso', 'completado', 'cancelado'],
    default: 'planificado'
    },
    requiredResources: [{ // recursosRequeridos
    resourceType: { // tipoRecurso
      type: String,
      enum: ['sonido', 'mobiliario', 'catering', 'iluminacion', 'otros'],
      required: true
    },
    description: { // descripción
      type: String,
      required: true
    },
    quantity: { // cantidad
      type: Number,
      required: true,
      min: 1
    },
    assignedProvider: { // proveedorAsignado
      type: Schema.Types.ObjectId,
       ref: 'Proveedor'
    }
  }],
  assignedStaff: [{ // personalAsignado
    employee: { // empleado
      type: Schema.Types.ObjectId,
      ref: 'Personal',
      required: true
    },
    shift: { // turno
      type: String,
      enum: ['mañana', 'tarde', 'noche', 'completo'],
      required: true
    },
    role: { // rol
      type: String,
      required: true
    }
  }],
   notes: { // notas
    type: String,
    trim: true
  },
  createdBy: { // creadoPor
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  creationDate: { // fechaCreacion
    type: Date,
    default: Date.now
  },
  lastModified: { // ultimaModificacion
    type: Date,
    default: Date.now
  }
});

// Índices para búsquedas frecuentes
eventoSchema.index({ startDate: 1 });
eventoSchema.index({ endDate: 1 });
eventoSchema.index({ status: 1 });
eventoSchema.index({ responsable: 1 });

// Middleware para actualizar la fecha de modificación
eventoSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

const Evento = mongoose.model('Evento', eventoSchema);

module.exports = Evento;