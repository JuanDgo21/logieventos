const mongoose = require('mongoose');

const tipoRecursoSchema = new mongoose.Schema({
    totipo_recursos: {
        type: Number,
        required: true,
        unique: true  // Asumo que es un identificador único
    },
    tipo_recursos: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    }
}, { timestamps: true });

module.exports = mongoose.model('ResourceType', tipoRecursoSchema);