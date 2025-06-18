const mongoose = require('mongoose');

/**
 * Modelo de Personal (Staff)
 * Contiene la información detallada de cada miembro del equipo
 */
const staffSchema = new mongoose.Schema({
    // Información básica de identificación
    identificacion: {
        type: String,
        required: [true, 'La identificación es obligatoria'],
        unique: true,
        trim: true,
        match: [/^[A-Za-z0-9-]+$/, 'Identificación no válida']
    },

    // Información personal
    nombreCompleto: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true
    },
    fechaNacimiento: Date,
    genero: {
        type: String,
        enum: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']
    },

    // Información de contacto
    contacto: {
        telefono: {
            type: String,
            required: [true, 'El teléfono es obligatorio'],
            match: [/^\+?\d{7,15}$/, 'Número de teléfono no válido']
        },
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Email no válido']
        }
    },

    // Relación con el tipo de personal y rol específico
    tipoPersonal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StaffType',
        required: [true, 'El tipo de personal es obligatorio']
    },
    rol: {
        type: String,
        required: [true, 'El rol es obligatorio'],
        trim: true
    },

    // Información profesional
    certificaciones: [{
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        fechaExpedicion: Date,
        fechaVencimiento: Date
    }],
    habilidades: [{
        type: String,
        trim: true
    }],
    experiencia: { // En años
        type: Number,
        min: 0,
        default: 0
    },

    // Estado actual
    estado: {
        activo: {
            type: Boolean,
            default: true
        },
        disponibilidad: {
            type: String,
            enum: ['Disponible', 'Asignado', 'Vacaciones', 'Incapacitado'],
            default: 'Disponible'
        }
    },

    // Observaciones adicionales
    observaciones: {
        type: String,
        maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres']
    }
}, {
    timestamps: true,  // Agrega createdAt y updatedAt automáticamente
    versionKey: false, // Elimina el campo __v
    toJSON: { virtuals: true } // Incluye propiedades virtuales al convertir a JSON
});

// Validar que el rol existe en el tipo de personal seleccionado
staffSchema.pre('save', async function(next) {
    console.log(`[Staff] Validando personal: ${this.nombreCompleto}`);
    
    const tipo = await mongoose.model('StaffType').findById(this.tipoPersonal);
    
    if (!tipo) {
        throw new Error('Tipo de personal no encontrado');
    }

    // Verificar que el rol existe en el tipo seleccionado
    const rolExiste = tipo.roles.some(r => r.nombre === this.rol);
    if (!rolExiste) {
        throw new Error(`El rol "${this.rol}" no existe en la categoría "${tipo.nombre}"`);
    }

    // Verificar certificaciones si el rol lo requiere
    const rolInfo = tipo.roles.find(r => r.nombre === this.rol);
    if (rolInfo.requiereCertificacion && (!this.certificaciones || this.certificaciones.length === 0)) {
        throw new Error(`El rol "${this.rol}" requiere al menos una certificación`);
    }

    next();
});

// Manejo de errores de duplicados
staffSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        console.error('[Staff] Error de duplicado:', error.message);
        next(new Error('Ya existe un personal con esa identificación'));
    } else {
        next(error);
    }
});

// Virtual para obtener la categoría completa
staffSchema.virtual('categoria').get(function() {
    return mongoose.model('StaffType').findById(this.tipoPersonal);
});

// Método para verificar disponibilidad
staffSchema.methods.estaDisponible = function() {
    return this.estado.activo && this.estado.disponibilidad === 'Disponible';
};

module.exports = mongoose.model('Staff', staffSchema);