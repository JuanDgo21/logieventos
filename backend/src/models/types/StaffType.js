const mongoose = require('mongoose');

const staffTypeSchema = new mongoose.Schema({
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
        ],
        validate: {
            validator: function(v) {
                return this.constructor.schema.path('name').enumValues.includes(v);
            },
            message: props => `${props.value} no es un valor válido para el nombre`
        }
    },
    description: {
        type: String,
        maxlength: [300, 'Máximo 300 caracteres']
    },
    isActive: {
        type: Boolean,
        default: true 
    },  
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El creador es obligatorio']
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    versionKey: false
});

// Middleware para evitar eliminación si hay usuarios asociados
staffTypeSchema.pre('remove', async function(next) {
    const usersWithThisType = await mongoose.model('User').countDocuments({ 
        staffTypeId: this._id 
    });
    
    if (usersWithThisType > 0) {
        throw new Error('No se puede eliminar: hay personal asignado a esta categoría');
    }
    
    next();
});

// Método para obtener personal activo
staffTypeSchema.methods.getActiveStaff = async function() {
    return await mongoose.model('User').find({ 
        staffTypeId: this._id, 
        status: 'active' 
    }).select('-password');
};

module.exports = mongoose.model('StaffType', staffTypeSchema);