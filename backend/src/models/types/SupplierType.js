const mongoose = require('mongoose');

const tipoProveedorSchema = new mongoose.Schema({
    titipo_proveedores: {
        type: Number,
        required: true,
        unique: true  // Identificador único
    },
    tipo_proveedores: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45,
        unique: true  // Asumo que los tipos deben ser únicos
    }
}, { timestamps: true });

// Opcional: Validación adicional para el tipo de proveedor
tipoProveedorSchema.path('tipo_proveedores').validate(function(value) {
    return value && value.trim().length > 0;
}, 'El tipo de proveedor no puede estar vacío');

module.exports = mongoose.model('TipoProveedor', tipoProveedorSchema);