const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema({
    Mproveedores: {
        type: Number,
        required: true,
        unique: true  // Asumo que es un identificador único
    },
    nombre: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    telefono: {
        type: Number,
        required: true
    },
    correo_electronico: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 45
    },
    disponible: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    }
}, { timestamps: true });

module.exports = mongoose.model('Proveedor', proveedorSchema);