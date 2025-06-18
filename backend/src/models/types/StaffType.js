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
        required: [true, 'El nombre es obligatorio'], // Validación: campo requerido
        trim: true, // Elimina espacios en blanco al inicio/final
        unique: true, // No puede haber dos tipos con el mismo nombre
        // Lista de valores permitidos (categorías predefinidas)
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
        maxlength: [300, 'Máximo 300 caracteres'] // Validación: longitud máxima
    },
    // Indica si el tipo de personal está activo (no se usa para asignaciones si es false)
    isActive: {
        type: Boolean,
        default: true // Por defecto se crea como activo
    },
    // Array de certificaciones requeridas para este tipo de personal
    requiredCertifications: [{
        type: String,
        // Lista de certificaciones permitidas (puede crecer según necesidades)
        enum: ['Manipulación de alimentos', 'Primeros auxilios', 'Seguridad laboral']
    }]
}, {
    timestamps: true, // Añade automáticamente createdAt y updatedAt
    versionKey: false // Desactiva el campo __v que Mongoose añade por defecto
});

console.log('Definido el esquema base de StaffType con sus campos y validaciones');

// ----- Middlewares (Funciones que se ejecutan antes/después de ciertas acciones) -----

/**
 * Middleware PRE-REMOVE: Se ejecuta antes de eliminar un tipo de personal
 * - Verifica que no haya usuarios asignados a este tipo
 * - Si hay usuarios asignados, lanza un error y cancela la eliminación
 */
staffTypeSchema.pre('remove', async function(next) {
    console.log(`Ejecutando pre-remove para StaffType con ID: ${this._id}`);
    
    // Busca usuarios que tengan asignado este tipo de personal
    const usersWithThisType = await mongoose.model('User').countDocuments({ 
        staffTypeId: this._id 
    });
    
    console.log(`Usuarios encontrados con este tipo: ${usersWithThisType}`);
    
    if (usersWithThisType > 0) {
        console.error('Intento de eliminar tipo de personal con usuarios asignados');
        throw new Error('No se puede eliminar: hay personal asignado a esta categoría');
    }
    
    next(); // Continúa con la operación si no hay usuarios asignados
});

// ----- Métodos del Modelo (Funciones disponibles en las instancias) -----

/**
 * Método de instancia: Obtiene todos los usuarios activos de este tipo de personal
 * @returns {Promise<Array>} Lista de usuarios activos con este staffType
 */
staffTypeSchema.methods.getActiveStaff = async function() {
    console.log(`Buscando usuarios activos para StaffType ID: ${this._id}`);
    
    const activeStaff = await mongoose.model('User').find({ 
        staffTypeId: this._id, 
        status: 'active' 
    });
    
    console.log(`Usuarios activos encontrados: ${activeStaff.length}`);
    return activeStaff;
};

// Exporta el modelo para poder usarlo en otras partes de la aplicación
module.exports = mongoose.model('StaffType', staffTypeSchema);
console.log('Modelo StaffType exportado correctamente');