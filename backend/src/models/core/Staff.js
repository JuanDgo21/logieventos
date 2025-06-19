const mongoose = require('mongoose');

console.log('Iniciando definición del modelo Staff...');

/**
 * Modelo de Personal (Staff)
 * - Contiene información básica de los miembros del staff
 * - Relacionado con User (usuario del sistema) y StaffType (categoría de personal)
 */
const StaffSchema = new mongoose.Schema({
    // --- Relación con Usuario ---
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        validate: {
            validator: async function(value) {
                console.log(`Validando existencia de usuario con ID: ${value}`);
                const user = await mongoose.model('User').findById(value);
                return !!user;
            },
            message: 'El usuario referenciado no existe'
        }
    },

    // --- Información Básica ---
    identification: {
        type: String,
        required: [true, 'La identificación es obligatoria'],
        unique: true,
        trim: true,
        match: [/^[A-Za-z0-9-]+$/, 'Identificación no válida']
    },
    name: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true
    },

    // --- Contacto ---
    phone: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        match: [/^\+?\d{7,15}$/, 'Número de teléfono no válido']
    },
    emergencyContact: String,

    // --- Relación con Tipo de Personal ---
    staffTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StaffType',
        required: [true, 'El tipo de personal es obligatorio']
    },
    role: {
        type: String,
        required: [true, 'El rol es obligatorio'],
        trim: true
    },

    // --- Estado ---
    asistencia: {
        type: Boolean,
        default: false
    },

    // --- Auditoría ---
    createdAt: { 
        type: Date, 
        default: Date.now
    }
}, {
    versionKey: false,
    toJSON: { virtuals: true }
});

console.log('Esquema base de Staff definido con campos esenciales');

// ----------------------------
// Middlewares y Validaciones
// ----------------------------

/**
 * Middleware PRE-SAVE: Se ejecuta antes de guardar un documento Staff
 * - Valida que el staffTypeId exista
 */
StaffSchema.pre('save', async function(next) {
    console.log(`Ejecutando pre-save para Staff ID: ${this._id}`);
    
    // Validar existencia del tipo de personal
    console.log(`Validando StaffType con ID: ${this.staffTypeId}`);
    const staffType = await mongoose.model('StaffType').findById(this.staffTypeId);
    if (!staffType) {
        console.error('Tipo de personal no encontrado');
        throw new Error('Tipo de personal no encontrado');
    }
    
    console.log('Validaciones de pre-save completadas con éxito');
    next();
});

/**
 * Middleware PRE-REMOVE: Se ejecuta antes de eliminar un Staff
 */
StaffSchema.pre('remove', async function(next) {
    console.log(`Ejecutando pre-remove para Staff ID: ${this._id}`);
    next();
});

// ----------------------------
// Métodos y Virtuals
// ----------------------------

/**
 * Virtual: Obtiene el documento completo del StaffType asociado
 */
StaffSchema.virtual('staffType', {
    ref: 'StaffType',
    localField: 'staffTypeId',
    foreignField: '_id',
    justOne: true
});

console.log('Virtual "staffType" definido para población automática');

// Exportar el modelo
module.exports = mongoose.model('Staff', StaffSchema);
console.log('Modelo Staff exportado correctamente');