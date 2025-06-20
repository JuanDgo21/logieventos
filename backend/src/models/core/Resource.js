const mongoose = require('mongoose');

const recursoSchema = new mongoose.Schema({
    idRecursos: {
        type: Number,
        required: true,
        unique: true
    },
    nombreRecursos: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    cantidadRecursos: {
        type: Number,
        required: true,
        min: 1
    },
    disponibilidadR: {
        type: String,
        required: true,
        enum: ['Disponible', 'Asignado', 'En Mantenimiento'], // Valores controlados
        default: 'Disponible'
    },
    mantenimientoR: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    
    eventoAsignado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evento', // Relación con modelo Evento
        default: null
    },
    tipoRecurso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tipoRecurso', // Asumiendo que existe este modelo
        required: true
    },
    ultimaModificacion: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true,
    versionKey: false
});

// Validación previa a guardar
recursoSchema.pre('save', function(next) {
    if (this.disponibilidadR === 'Asignado' && !this.eventoAsignado) {
        throw new Error('Debe especificar un evento cuando el recurso está asignado');
    }
    next();
});

module.exports = mongoose.model('Recurso', recursoSchema);