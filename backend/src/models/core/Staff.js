const mongoose = require('mongoose');

console.log('Iniciando definición del modelo Staff...');

/**
 * Modelo de Personal (Staff)
 * - Contiene información completa de los miembros del staff
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
        match: [/^[A-Za-z0-9-]+$/, 'Identificación no válida'] // Solo letras, números y guiones
    },
    name: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true // Elimina espacios en blanco al inicio/final
    },
    birthDate: {
        type: Date,
        validate: {
            validator: function(date) {
                console.log(`Validando fecha de nacimiento: ${date}`);
                return !date || date < new Date();
            },
            message: 'La fecha de nacimiento no puede ser futura'
        }
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'] // Valores permitidos
    },

    // --- Contacto ---
    phone: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        match: [/^\+?\d{7,15}$/, 'Número de teléfono no válido'] // Formato internacional
    },
    emergencyContact: String, // Contacto de emergencia opcional

    // --- Relación con Tipo de Personal ---
    staffTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StaffType',
        required: [true, 'El tipo de personal es obligatorio']
    },
    role: {  // Rol específico dentro del tipo (ej: "Mesero", "Técnico de Sonido")
        type: String,
        required: [true, 'El rol es obligatorio'],
        trim: true
    },

    // --- Información Profesional ---
    certifications: [{
        name: { type: String, required: true }, // Nombre de la certificación
        fileUrl: { type: String, required: true }, // URL del documento
        validatedBy: {  // Admin que aprobó el documento
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    skills: [{ // Habilidades del staff
        type: String,
        trim: true
    }],
    experience: {  // En años
        type: Number,
        min: 0, // No puede ser negativo
        default: 0 // Valor por defecto
    },

    // --- Estado y Disponibilidad ---
    isActive: {
        type: Boolean,
        default: true // Por defecto está activo
    },
    availability: {
        status: {
            type: String,
            enum: ['Available', 'Assigned', 'On Leave', 'Unavailable'],
            default: 'Available'
        },
        unavailableUntil: Date  // Para bloqueos temporales
    },

    // --- Historial de Eventos ---
    assignedEvents: [{
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        },
        role: String, // Rol específico en ese evento
        rating: {  // Calificación (1-5)
            type: Number,
            min: 1,
            max: 5
        }
    }],

    // --- Auditoría ---
    createdAt: { 
        type: Date, 
        default: Date.now // Fecha automática de creación
    }
}, {
    versionKey: false, // Elimina el campo __v
    toJSON: { virtuals: true } // Incluye virtuals al convertir a JSON
});

console.log('Esquema base de Staff definido con todos los campos');

// ----------------------------
// Middlewares y Validaciones
// ----------------------------

/**
 * Middleware PRE-SAVE: Se ejecuta antes de guardar un documento Staff
 * - Valida que el staffTypeId exista
 * - Verifica que tenga las certificaciones requeridas
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

    // Verificar certificaciones requeridas
    console.log('Verificando certificaciones requeridas...');
    const missingCerts = staffType.requiredCertifications.filter(cert => 
        !this.certifications.some(c => c.name === cert)
    );
    
    if (missingCerts.length > 0) {
        console.error(`Certificaciones faltantes: ${missingCerts.join(', ')}`);
        throw new Error(`Faltan certificaciones: ${missingCerts.join(', ')}`);
    }
    
    console.log('Validaciones de pre-save completadas con éxito');
    next();
});

/**
 * Middleware PRE-REMOVE: Se ejecuta antes de eliminar un Staff
 * - Evita eliminar personal asignado a eventos
 */
StaffSchema.pre('remove', async function(next) {
    console.log(`Ejecutando pre-remove para Staff ID: ${this._id}`);
    
    const events = await mongoose.model('Event').countDocuments({
        'assignedStaff.staffId': this._id
    });
    
    console.log(`Eventos encontrados con este staff: ${events}`);
    
    if (events > 0) {
        console.error('Intento de eliminar staff asignado a eventos');
        throw new Error('No se puede eliminar: personal asignado a eventos activos');
    }
    
    next();
});

// ----------------------------
// Métodos y Virtuals
// ----------------------------

/**
 * Virtual: Obtiene el documento completo del StaffType asociado
 * - Permite acceder a staffType como si fuera un campo normal
 */
StaffSchema.virtual('staffType', {
    ref: 'StaffType',
    localField: 'staffTypeId',
    foreignField: '_id',
    justOne: true
});

console.log('Virtual "staffType" definido para población automática');

/**
 * Método de instancia: Verifica disponibilidad para un evento
 * @param {String} eventId - ID del evento a verificar
 * @returns {Boolean} true si está disponible, false si tiene conflicto
 */
StaffSchema.methods.checkAvailability = async function(eventId) {
    console.log(`Verificando disponibilidad para evento ID: ${eventId}`);
    
    const event = await mongoose.model('Event').findById(eventId);
    console.log(`Evento a verificar: ${event?.name} (${event?.startDate} - ${event?.endDate})`);
    
    const isAvailable = !this.assignedEvents.some(e => 
        e.eventId.startDate <= event.endDate && 
        e.eventId.endDate >= event.startDate
    );
    
    console.log(`Resultado de disponibilidad: ${isAvailable}`);
    return isAvailable;
};

// Exportar el modelo
module.exports = mongoose.model('Staff', StaffSchema);
console.log('Modelo Staff exportado correctamente');