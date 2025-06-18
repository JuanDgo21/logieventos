const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Esquema para TipoPersonal (Especializado para Eventos)
 * Define los diferentes roles o tipos de personal que pueden existir en la organización de eventos
 */
const TipoPersonalSchema = new Schema({
  codigo: {
    type: String,
    required: [true, 'El código es obligatorio'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [10, 'El código no puede exceder 10 caracteres'],
    match: [/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números'],
    example: "COORD-GEN" // Ejemplo de código para Coordinador General
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    unique: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    example: "Coordinador General del Evento" // Ejemplo de nombre
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: {
      values: [
        'Coordinación y Gestión',
        'Presentación y Animación',
        'Técnico',
        'Servicios Generales',
        'Seguridad y Emergencias',
        'Comunicación y Prensa',
        'Atención al Público',
        'Soporte Tecnológico',
        'Otros'
      ],
      message: 'Categoría no válida'
    },
    example: "Coordinación y Gestión"
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
    example: "Responsable de la planificación general y supervisión de todo el evento"
  },
  nivelJerarquico: {
    type: Number,
    min: [1, 'El nivel jerárquico mínimo es 1'],
    max: [10, 'El nivel jerárquico máximo es 10'],
    example: 1 // Para cargos de alta dirección
  },
  requiereCertificaciones: {
    type: Boolean,
    default: false,
    example: true // Para personal de seguridad o técnicos
  },
  habilidadesRequeridas: [{
    type: String,
    trim: true,
    maxlength: [50, 'Cada habilidad no puede exceder 50 caracteres'],
    example: "Manejo de equipos de sonido profesional"
  }],
  activo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false,
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' }
});

console.log('Esquema de TipoPersonal para eventos creado:', TipoPersonalSchema);

// Índices para búsquedas frecuentes
TipoPersonalSchema.index({ codigo: 1 });
TipoPersonalSchema.index({ nombre: 1 });
TipoPersonalSchema.index({ categoria: 1 });
TipoPersonalSchema.index({ nivelJerarquico: 1 });

/**
 * Middleware para registrar en consola antes de guardar
 */
TipoPersonalSchema.pre('save', function(next) {
  console.log(`Guardando/actualizando tipo de personal: ${this.nombre}`);
  this.fechaActualizacion = Date.now();
  next();
});

/**
 * Método para obtener todos los tipos por categoría
 */
TipoPersonalSchema.statics.porCategoria = function(categoria) {
  console.log(`Buscando tipos de personal para categoría: ${categoria}`);
  return this.find({ categoria, activo: true }).sort({ nivelJerarquico: 1 });
};

/**
 * Método para añadir un nuevo tipo de personal dinámicamente
 */
TipoPersonalSchema.statics.crearNuevoTipo = async function(datosTipo) {
  try {
    console.log('Intentando crear nuevo tipo de personal:', datosTipo);
    
    // Si la categoría no existe, se añade a "Otros"
    if (!this.schema.path('categoria').enumValues.includes(datosTipo.categoria)) {
      console.warn('Categoría no estándar detectada, asignando a "Otros"');
      datosTipo.categoria = 'Otros';
    }
    
    const nuevoTipo = new this(datosTipo);
    return await nuevoTipo.save();
  } catch (error) {
    console.error('Error al crear nuevo tipo de personal:', error.message);
    throw error;
  }
};

const TipoPersonal = mongoose.model('TipoPersonal', TipoPersonalSchema);

console.log('Modelo TipoPersonal para eventos registrado en Mongoose');

module.exports = TipoPersonal;