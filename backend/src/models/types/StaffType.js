const mongoose = require('mongoose');

/**
 * Modelo de Tipo de Personal (StaffType)
 * - Define las categorías de personal que pueden existir en el sistema
 * - Se relaciona con el modelo User para asignar tipos a usuarios
 * - Ejemplos: "Técnico", "Logística", "Seguridad", etc.
 */
const staffTypeSchema = new mongoose.Schema({
    // Nombre del tipo de personal (debe ser único)
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        unique: true,
        enum: [
            'Coordinación y Gestión', 
            'Personal Técnico', 
            'Servicios Generales',
            'Seguridad',
            'Logística'
        ]
    },
    // Descripción opcional del tipo de personal
    description: {
        type: String,
        maxlength: [300, 'Máximo 300 caracteres']
    },
    // Indica si el tipo de personal está activo (no se usa para asignaciones si es false)
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

console.log('Definido el esquema base de StaffType con sus campos y validaciones');

// ----- Middlewares -----

staffTypeSchema.pre('remove', async function(next) {
    console.log(`Ejecutando pre-remove para StaffType con ID: ${this._id}`);
    
    const usersWithThisType = await mongoose.model('User').countDocuments({ 
        staffTypeId: this._id 
    });
    
    console.log(`Usuarios encontrados con este tipo: ${usersWithThisType}`);
    
    if (usersWithThisType > 0) {
        console.error('Intento de eliminar tipo de personal con usuarios asignados');
        throw new Error('No se puede eliminar: hay personal asignado a esta categoría');
    }
    
    next();
});

// ----- Métodos del Modelo -----

staffTypeSchema.methods.getActiveStaff = async function() {
    console.log(`Buscando usuarios activos para StaffType ID: ${this._id}`);
    
    const activeStaff = await mongoose.model('User').find({ 
        staffTypeId: this._id, 
        status: 'active' 
    });
    
    console.log(`Usuarios activos encontrados: ${activeStaff.length}`);
    return activeStaff;
};

module.exports = mongoose.model('StaffType', staffTypeSchema);
console.log('Modelo StaffType exportado correctamente');