const mongoose = require('mongoose');
const validator = require('validator');

const proveedorSchema = new mongoose.Schema({
  idproveedores: {
    type: Number,
    required: [true, 'El ID de proveedor es obligatorio'],
    unique: true,
    index: true,
    validate: {
      validator: Number.isInteger,
      message: 'El ID de proveedor debe ser un número entero'
    }
  },
  nombreP: {
    type: String,
    required: [true, 'El nombre del proveedor es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres'],
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  telefonoP: {
    type: String, // Usamos String en lugar de Number para permitir formatos internacionales
    required: [true, 'El teléfono es obligatorio'],
    validate: {
      validator: function(v) {
        return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v);
      },
      message: props => `${props.value} no es un número de teléfono válido!`
    },
    trim: true
  },
  correoP: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: props => `${props.value} no es un correo electrónico válido!`
    }
  },
  disponibleP: {
    type: String,
    required: true,
    enum: {
      values: ['Disponible', 'No disponible', 'Limitado', 'Solo emergencias'],
      message: 'El estado de disponibilidad no es válido'
    },
    default: 'Disponible'
  },
  servicios: {
    type: [String],
    enum: ['Catering', 'Audio', 'Video', 'Iluminación', 'Mobiliario', 'Seguridad', 'Otros'],
    default: []
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  calificacion: {
    type: Number,
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5'],
    default: 3
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar el rendimiento
proveedorSchema.index({ nombreP: 'text' });
proveedorSchema.index({ disponibleP: 1 });
proveedorSchema.index({ servicios: 1 });

// Middleware para validaciones adicionales
proveedorSchema.pre('save', function(next) {
  // Eliminar espacios en blanco adicionales
  if (this.telefonoP) {
    this.telefonoP = this.telefonoP.replace(/\s+/g, '').trim();
  }
  next();
});

// Método para verificar disponibilidad
proveedorSchema.methods.estaDisponible = function() {
  return this.disponibleP === 'Disponible' || this.disponibleP === 'Limitado';
};

// Método para agregar servicios
proveedorSchema.methods.agregarServicio = function(servicio) {
  if (!this.servicios.includes(servicio)) {
    this.servicios.push(servicio);
  }
  return this.save();
};

// Virtual para información resumida
proveedorSchema.virtual('infoResumida').get(function() {
  return `${this.nombreP} - ${this.servicios.join(', ')} (${this.disponibleP})`;
});

// Static method para buscar proveedores por disponibilidad
proveedorSchema.statics.buscarPorDisponibilidad = function(estado) {
  return this.find({ disponibleP: estado });
};

// Static method para buscar proveedores por servicio
proveedorSchema.statics.buscarPorServicio = function(servicio) {
  return this.find({ servicios: servicio });
};

module.exports = mongoose.model('Proveedor', proveedorSchema);