const mongoose = require('mongoose');

/**
 * Modelo de Tipo de Personal (StaffType)
 * Define las categorías principales y roles específicos del personal de eventos
 * Ejemplo: 
 * - Tipo: "Coordinación y Gestión"
 * - Roles incluidos: ["Coordinador General", "Productor", "Encargado de Logística", etc.]
 */
const staffTypeSchema = new mongoose.Schema({
    // Nombre de la categoría principal
    nombre: {
        type: String,
        required: [true, 'El nombre del tipo de personal es obligatorio'],
        trim: true,
        unique: true,
        enum: [ // Lista de categorías principales
            'Coordinación y Gestión',
            'Presentación y Animación',
            'Personal Técnico',
            'Servicios Generales',
            'Seguridad y Emergencias',
            'Comunicación y Prensa',
            'Apoyo y Atención al Público',
            'Soporte Tecnológico'
        ],
        message: 'Categoría de personal no válida'
    },

    // Descripción general de la categoría
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        maxlength: [300, 'La descripción no puede exceder los 300 caracteres']
    },

    // Lista de roles específicos dentro de esta categoría
    roles: {
        type: [{
            nombre: {
                type: String,
                required: [true, 'El nombre del rol es obligatorio'],
                trim: true
            },
            descripcion: {
                type: String,
                trim: true,
                maxlength: [200, 'La descripción del rol no puede exceder 200 caracteres']
            },
            requiereCertificacion: {
                type: Boolean,
                default: false
            }
        }],
        required: [true, 'Debe especificar al menos un rol para este tipo'],
        validate: {
            validator: function(roles) {
                return roles.length > 0;
            },
            message: 'Debe existir al menos un rol para este tipo de personal'
        }
    },

    // Icono representativo (para interfaces gráficas)
    icono: {
        type: String,
        default: '👔'
    }
}, {
    timestamps: true,  // Agrega createdAt y updatedAt automáticamente
    versionKey: false // Elimina el campo __v
});

// Middleware para validar antes de guardar
staffTypeSchema.pre('save', function(next) {
    console.log(`[StaffType] Preparando para guardar tipo: ${this.nombre}`);
    
    // Asegurar que los nombres de roles sean únicos dentro del tipo
    const rolesUnicos = new Set(this.roles.map(r => r.nombre.toLowerCase()));
    if (rolesUnicos.size !== this.roles.length) {
        throw new Error('No puede haber roles duplicados dentro de un mismo tipo');
    }
    
    next();
});

// Manejo de errores de duplicados
staffTypeSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        console.error('[StaffType] Error de duplicado:', error.message);
        next(new Error('Ya existe un tipo de personal con ese nombre'));
    } else {
        next(error);
    }
});

// Método para agregar un nuevo rol al tipo
staffTypeSchema.methods.agregarRol = function(nuevoRol) {
    console.log(`[StaffType] Agregando rol "${nuevoRol.nombre}" a ${this.nombre}`);
    this.roles.push(nuevoRol);
    return this.save();
};

module.exports = mongoose.model('StaffType', staffTypeSchema);