const mongoose = require('mongoose');

const personalSchema = new mongoose.Schema({
  identificacion: {
    type: Number,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} no es un número entero válido para identificación'
    }
  },
  nombrePe: { 
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  telefonoPe: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v);
      },
      message: props => `${props.value} no es un número de teléfono válido!`
    }
  },
  disponiblePe: {
    type: Boolean,
    default: true,
    required: true
  },
  asistencia: {
    type: Boolean,
    default: false,
    required: true
  },
  observacion: {
    type: String,
    trim: true,
    maxlength: [500, 'La observación no puede exceder los 500 caracteres'],
    default: ''
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices adicionales para mejorar el rendimiento de búsquedas comunes
personalSchema.index({ nombrePe: 'text' });
personalSchema.index({ disponiblePe: 1, asistencia: 1 });

// Middleware para validar datos antes de guardar
personalSchema.pre('save', function(next) {
  // Puedes añadir lógica de pre-procesamiento aquí si es necesario
  next();
});

// Método para marcar asistencia
personalSchema.methods.marcarAsistencia = function(presente, observaciones = '') {
  this.asistencia = presente;
  this.observacion = observaciones;
  return this.save();
};

// Método para cambiar disponibilidad
personalSchema.methods.cambiarDisponibilidad = function(disponible) {
  this.disponiblePe = disponible;
  return this.save();
};

// Virtual para estado completo del personal
personalSchema.virtual('estado').get(function() {
  if (!this.disponiblePe) return 'No disponible';
  return this.asistencia ? 'Presente en evento' : 'Disponible (sin asignar)';
});

// Static method para buscar personal disponible
personalSchema.statics.buscarDisponibles = function() {
  return this.find({ disponiblePe: true });
};

module.exports = mongoose.model('Personal', personalSchema);