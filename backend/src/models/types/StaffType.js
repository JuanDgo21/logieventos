const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const tipoPersonalSchema = new mongoose.Schema({
  idtipo_personal: {
    type: Number,
    required: [true, 'El ID de tipo de personal es obligatorio'],
    unique: true,
    index: true,
    validate: {
      validator: Number.isInteger,
      message: 'El ID de tipo de personal debe ser un número entero'
    }
  },
  tipo_personal: {
    type: String,
    required: [true, 'El tipo de personal es obligatorio'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [50, 'El tipo de personal no puede exceder los 50 caracteres'],
    minlength: [3, 'El tipo de personal debe tener al menos 3 caracteres'],
    enum: {
      values: [
        'ORGANIZADOR', 
        'LOGISTICA', 
        'SEGURIDAD', 
        'ATENCION', 
        'TECNICO', 
        'COORDINADOR',
        'AYUDANTE',
        'SUPERVISOR'
      ],
      message: 'Tipo de personal no válido. Valores permitidos: ORGANIZADOR, LOGISTICA, SEGURIDAD, ATENCION, TECNICO, COORDINADOR, AYUDANTE, SUPERVISOR'
    }
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [200, 'La descripción no puede exceder los 200 caracteres']
  },
  nivel_autoridad: {
    type: Number,
    min: [1, 'El nivel mínimo de autoridad es 1'],
    max: [10, 'El nivel máximo de autoridad es 10'],
    default: 1
  },
  requiere_certificacion: {
    type: Boolean,
    default: false
  },
  activo: {
    type: Boolean,
    default: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Plugin para mensajes de error más descriptivos en campos únicos
tipoPersonalSchema.plugin(uniqueValidator, { 
  message: 'Error, el {PATH} {VALUE} ya existe' 
});

// Índices para mejorar el rendimiento
tipoPersonalSchema.index({ tipo_personal: 1 });
tipoPersonalSchema.index({ nivel_autoridad: 1 });
tipoPersonalSchema.index({ activo: 1 });

// Middleware para normalización de datos
tipoPersonalSchema.pre('save', function(next) {
  // Eliminar espacios múltiples y normalizar
  if (this.tipo_personal) {
    this.tipo_personal = this.tipo_personal.trim().replace(/\s+/g, ' ');
  }
  next();
});

// Método para activar/desactivar tipo de personal
tipoPersonalSchema.methods.cambiarEstado = function(activo) {
  this.activo = activo;
  return this.save();
};

// Método para verificar si requiere certificación
tipoPersonalSchema.methods.requiereCertificacion = function() {
  return this.requiere_certificacion;
};

// Virtual para información completa
tipoPersonalSchema.virtual('infoCompleta').get(function() {
  return `${this.tipo_personal} (Nivel ${this.nivel_autoridad}) - ${this.descripcion || 'Sin descripción'}`;
});

// Static method para buscar tipos activos
tipoPersonalSchema.statics.buscarActivos = function() {
  return this.find({ activo: true }).sort({ nivel_autoridad: -1 });
};

// Static method para buscar por nivel de autoridad
tipoPersonalSchema.statics.buscarPorNivelAutoridad = function(min, max) {
  return this.find({ 
    nivel_autoridad: { $gte: min, $lte: max },
    activo: true
  });
};

module.exports = mongoose.model('TipoPersonal', tipoPersonalSchema);

// Pruebajejejejejeje