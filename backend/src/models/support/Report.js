const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema({
    idreportes: {
        type: Number,
        required: true,
        unique: true
    },
    fechaRe: {
        type: Date,
        required: true
    },
    tipoRe: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    usuarios_identificacion: {
        type: Number,
        required: true
    },
    eventos_ideventos: {
        type: Number,
        required: true
    },
    eventos_contratos_codigoContratos: {
        type: Number,
        required: true
    },
    contratos_codigoContratos: {
        type: Number,
        required: true
    },
    contratos_eventos_ideventos: {
        type: Number,
        required: true
    },
    contratos_eventos_contratos_codigoContratos: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Validación personalizada para la fecha
reporteSchema.path('fechaRe').validate(function(value) {
    return value instanceof Date && !isNaN(value);
}, 'La fecha debe ser una fecha válida');

module.exports = mongoose.model('Reporte', reporteSchema);