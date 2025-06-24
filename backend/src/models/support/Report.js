const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Esquema para el modelo de Reportes
 * Gestiona el seguimiento de incidencias y reportes del sistema
 */
const reportSchema = new Schema({
  // ID único del reporte (entero requerido)
  report_id: {
    type: Number,
    required: [true, 'El ID del reporte es obligatorio'],
    unique: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} debe ser un número entero'
    }
  },
  
  // Fecha del reporte (no puede ser futura)
  date: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'La fecha del reporte no puede ser futura'
    }
  },
  
  // Tipo de reporte (valores predefinidos)
  type: {
    type: String,
    required: true,
    enum: ['event', 'contract', 'staff', 'resource', 'supplier', 'other'],
    default: 'event'
  },
  
  // Titulo del reporte
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  
  // Descripción detallada
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },
  
  // Nivel de prioridad
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Estado actual del reporte
  status: {
    type: String,
    enum: ['pending', 'in_review', 'resolved', 'archived'],
    default: 'pending'
  },
  
  // Usuario que creó el reporte
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio'],
    validate: {
      validator: async function(value) {
        const user = await mongoose.model('User').exists({ _id: value });
        return user;
      },
      message: 'El usuario especificado no existe'
    }
  },
  
  // Relación con evento (opcional)
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    validate: {
      validator: async function(value) {
        if (!value) return true;
        return await mongoose.model('Event').exists({ _id: value });
      },
      message: 'El evento especificado no existe'
    }
  },
  
  // Relación con contrato (opcional)
  contract: {
    type: Schema.Types.ObjectId,
    ref: 'Contract',
    validate: {
      validator: async function(value) {
        if (!value) return true;
        return await mongoose.model('Contract').exists({ _id: value });
      },
      message: 'El contrato especificado no existe'
    }
  },
  
  // Fecha de cierre (si aplica)
  closed_at: Date,
  
  // Solución aplicada
  solution: String
}, {
  // Opciones del esquema
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  versionKey: false
});

// Índices para optimizar búsquedas
reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ created_by: 1 });
reportSchema.index({ date: -1 });
reportSchema.index({ title: 'text', description: 'text' });

/**
 * Middleware: Validar que tenga al menos evento o contrato asociado
 */
reportSchema.pre('save', function(next) {
  if (!this.event && !this.contract) {
    const err = new Error('El reporte debe estar asociado a un evento o contrato');
    console.error('[Report] Error de validación:', err.message);
    throw err;
  }
  next();
});

/**
 * Método de instancia: Cerrar reporte
 */
reportSchema.methods.closeReport = async function(solution) {
  if (this.status === 'resolved') {
    console.log(`[Report] Intento de cerrar reporte ya resuelto: ${this._id}`);
    throw new Error('El reporte ya está resuelto');
  }
  
  this.status = 'resolved';
  this.closed_at = new Date();
  this.solution = solution;
  
  console.log(`[Report] Cerrando reporte: ${this._id}`);
  return this.save();
};

/**
 * Método estático: Buscar por prioridad
 */
reportSchema.statics.findByPriority = function(priority) {
  console.log(`[Report] Buscando reportes con prioridad: ${priority}`);
  return this.find({ priority })
    .sort({ date: -1 })
    .populate('created_by', 'name identification');
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;