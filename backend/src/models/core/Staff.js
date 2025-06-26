const mongoose = require('mongoose');

console.log('Iniciando definición del modelo Staff...');

/**
 * Modelo de Personal (Staff)
 * - Contiene información básica de los miembros del staff
 * - Relacionado con User (usuario del sistema) y StaffType (categoría de personal)
 */
const StaffSchema = new mongoose.Schema({
    
    //preguntar sobre el user id o manualmente 

    // --- Información Básica ---
    identification: {
        type: String,
        required: [true, 'La identificación es obligatoria'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                console.log(`Validando identificación: ${v}`);
                // Validar formato: letras, números y guiones, 5-20 caracteres
                return /^[A-Za-z0-9-]{5,20}$/.test(v);
            },
            message: props => `${props.value} no es una identificación válida (solo letras, números y guiones, 5-20 caracteres)`
        }
    },
    name: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true,
        validate: {
            validator: function(v) {
                console.log(`Validando nombre: ${v}`);
                // Validar que sea un nombre completo con al menos 2 palabras
                const parts = v.trim().split(/\s+/);
                return parts.length >= 2 && parts.every(part => part.length >= 2);
            },
            message: 'Debe proporcionar al menos nombre y apellido (mínimo 2 caracteres cada uno)'
        }
    },

    // --- Contacto ---
    phone: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        validate: {
            validator: function(v) {
                console.log(`Validando teléfono: ${v}`);
                // Validar número internacional o local
                return /^(\+?\d{1,3}[- ]?)?\d{7,15}$/.test(v);
            },
            message: props => `${props.value} no es un número de teléfono válido`
        }
    },
    emergencyContact: {
    type: String,
    trim: true,
    validate: {
        validator: function(v) {
            if (!v) return true; // Opcional
            console.log(`Validando contacto de emergencia: ${v}`);
            // Permitir formato "nombre - número" o solo nombre
            return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}(?:\s*-\s*\+?\d{7,15})?$/.test(v);
        },
        message: 'Formato inválido. Use: "Nombre - +123456789" o solo nombre (3-50 caracteres)'
    }
},

    // --- Relación con Tipo de Personal ---
    staffTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StaffType',
        required: [true, 'El tipo de personal es obligatorio'],
        validate: {
            validator: function(v) {
                console.log(`Validando staffTypeId: ${v}`);
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: 'ID de tipo de personal no válido'
        }
    },

    // --- Estado ---
    asistencia: {
        type: Boolean,
        default: false,
        validate: {
            validator: function(v) {
                console.log(`Validando asistencia: ${v}`);
                return typeof v === 'boolean';
            },
            message: 'La asistencia debe ser un valor booleano'
        }
    },

    // --- Auditoría ---
    createdAt: { 
        type: Date, 
        default: Date.now,
        immutable: true, // No se puede modificar
        validate: {
            validator: function(v) {
                console.log(`Validando fecha de creación: ${v}`);
                return v instanceof Date && !isNaN(v.getTime());
            },
            message: 'Fecha de creación no válida'
        }
    }
}, {
    versionKey: false,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Eliminar campos sensibles al convertir a JSON
            delete ret.__v;
            delete ret._id;
            return ret;
        }
    },
    timestamps: false // Ya tenemos createdAt manual
});

console.log('Esquema base de Staff definido con campos esenciales');

// ----------------------------
// Middlewares y Validaciones
// ----------------------------

/**
 * Middleware PRE-SAVE: Se ejecuta antes de guardar un documento Staff
 * - Valida que el staffTypeId exista
 * - Normaliza formatos de teléfono e identificación
 */
StaffSchema.pre('save', async function(next) {
    console.log(`Ejecutando pre-save para Staff ID: ${this._id || 'nuevo'}`);
    
    try {
        // Normalizar teléfono (eliminar espacios y guiones)
        if (this.phone) {
            this.phone = this.phone.replace(/[-\s]/g, '');
            console.log(`Teléfono normalizado: ${this.phone}`);
        }

        // Normalizar identificación (mayúsculas, sin espacios)
        if (this.identification) {
            this.identification = this.identification.toUpperCase().trim();
            console.log(`Identificación normalizada: ${this.identification}`);
        }

        // Validar existencia del tipo de personal
        console.log(`Validando StaffType con ID: ${this.staffTypeId}`);
        const staffType = await mongoose.model('StaffType').findById(this.staffTypeId);
        if (!staffType) {
            console.error('Tipo de personal no encontrado');
            throw new Error('Tipo de personal no encontrado');
        }
        
        // Verificar que el tipo de personal esté activo
        if (!staffType.isActive) {
            console.error('Tipo de personal inactivo');
            throw new Error('No se puede asignar un tipo de personal inactivo');
        }

        console.log('Validaciones de pre-save completadas con éxito');
        next();
    } catch (error) {
        console.error(`Error en pre-save: ${error.message}`);
        next(error);
    }
});

/**
 * Middleware PRE-REMOVE: Se ejecuta antes de eliminar un Staff
 * - Verifica que no esté asociado a otros documentos importantes
 */
StaffSchema.pre('remove', async function(next) {
    console.log(`Ejecutando pre-remove para Staff ID: ${this._id}`);
    
    try {
        // Verificar si está asociado a algún usuario
        const userCount = await mongoose.model('User').countDocuments({ staffId: this._id });
        if (userCount > 0) {
            console.error('No se puede eliminar: staff asociado a usuarios');
            throw new Error('No se puede eliminar: existen usuarios asociados a este personal');
        }

        // Aquí podrías agregar más validaciones de referencias
        console.log('Validaciones de pre-remove completadas');
        next();
    } catch (error) {
        console.error(`Error en pre-remove: ${error.message}`);
        next(error);
    }
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

/**
 * Método para registrar asistencia
 */
StaffSchema.methods.registrarAsistencia = async function() {
    console.log(`Registrando asistencia para Staff ID: ${this._id}`);
    this.asistencia = true;
    return await this.save();
};

/**
 * Método para obtener información resumida
 */
StaffSchema.methods.getResumen = function() {
    return {
        id: this._id,
        nombre: this.name,
        tipo: this.staffTypeId,
        telefono: this.phone,
        asistio: this.asistencia
    };
};

console.log('Virtuals y métodos definidos para el modelo Staff');

// Indexes para mejor performance
StaffSchema.index({ identification: 1 }, { unique: true });
StaffSchema.index({ name: 'text' }); // Búsqueda por texto
StaffSchema.index({ staffTypeId: 1, asistencia: 1 }); // Filtros comunes

console.log('Índices creados para optimización de consultas');

// Exportar el modelo
const Staff = mongoose.model('Staff', StaffSchema);
console.log('Modelo Staff exportado correctamente');

module.exports = Staff;