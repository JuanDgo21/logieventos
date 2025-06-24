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
    // ... (todo el resto de la definición del schema se mantiene igual)
});

// CORRECCIÓN: Cambiar todas las instancias de eventoSchema por EventSchema
EventSchema.index({ startDate: 1 });
EventSchema.index({ endDate: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ responsable: 1 });

// Middleware para actualizar la fecha de modificación
EventSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// CORRECCIÓN: Usar EventSchema en lugar de eventoSchema
const Evento = mongoose.model('Evento', EventSchema);

module.exports = Evento;