const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    eventType: {
        type: Schema.Types.ObjectId,
        ref: 'EventType',
        required: [true, 'El tipo de evento es obligatorio']
    },
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'Contract',
        required: [true, 'El contrato del evento es obligatorio']
    },
    responsable: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El responsable del evento es obligatorio']
    },
    startDate: {
        type: Date,
        required: [true, 'La fecha de inicio es obligatoria']
    },
    endDate: {
        type: Date,
        required: [true, 'La fecha de fin es obligatoria'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'La fecha de fin debe ser posterior a la de inicio'
        }
    },
    status: {
        type: String,
        enum: ['planeación', 'confirmado', 'en_curso', 'completado', 'cancelado'],
        default: 'planeación'
    }
});

// Índices para búsquedas rápidas
EventSchema.index({ name: 'text', description: 'text' }); // Búsqueda full-text
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ contract: 1 });
EventSchema.index({ eventType: 1 });

// Middleware para validaciones adicionales
EventSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'completed') {
        this.completedAt = new Date();
    }
    next();
});

// Middleware para actualizar la fecha de modificación
EventSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Virtual para duración del evento (en horas)
EventSchema.virtual('durationHours').get(function() {
    return (this.endDate - this.startDate) / (1000 * 60 * 60);
});

// Método estático para eventos activos
EventSchema.statics.findActiveEvents = function() {
    return this.find({ 
        status: { $in: ['planeacion', 'confirmado', 'en_curso'] } 
    });
};


const Event = mongoose.model('Event', EventSchema);
module.exports = Event;