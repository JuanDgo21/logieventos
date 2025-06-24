const mongoose = require('mongoose');

const recursoSchema = new mongoose.Schema({
    idRecursos: {
        type: Number,
        required: true
    },
    nombreRecursos: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    cantidadRecursos: {
        type: Number,
        required: true
    },
    disponibilidadR: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    mantenimientoR: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    }
}, { timestamps: true });

module.exports = mongoose.model('Resource', recursoSchema);