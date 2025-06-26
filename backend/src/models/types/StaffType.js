const mongoose = require('mongoose');

// Definición del esquema para los tipos de personal
const staffTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],  // Validación de campo obligatorio
        trim: true,  // Elimina espacios en blanco al inicio y final
        unique: true,  // El nombre debe ser único en la base de datos
        enum: [  // Solo permite estos valores específicos
            'Coordinación y Gestión', 
            'Personal Técnico', 
            'Servicios Generales',
            'Seguridad',
            'Logística'
        ],
        validate: {
            validator: function(v) {
                console.log(`Validando nombre: ${v}`);  // Log para depuración
                // Verifica que el valor esté en los valores permitidos del enum
                return this.constructor.schema.path('name').enumValues.includes(v);
            },
            message: props => `${props.value} no es un valor válido para el nombre`
        }
    },
    description: {
        type: String,
        maxlength: [300, 'La descripción no puede exceder los 300 caracteres'],  // Validación de longitud máxima
        trim: true,
        validate: {
            validator: function(v) {
                console.log(`Validando descripción: ${v}`);  // Log para depuración
                // Validación opcional: puedes agregar regex para formato si es necesario
                return true;
            }
        }
    },
    isActive: {
        type: Boolean,
        default: true,  // Valor por defecto
        validate: {
            validator: function(v) {
                console.log(`Validando estado activo: ${v}`);  // Log para depuración
                return typeof v === 'boolean';  // Asegura que sea un valor booleano
            },
            message: 'El estado activo debe ser un valor booleano'
        }
    },  
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El creador es obligatorio'],  // Validación de campo obligatorio
        validate: {
            validator: function(v) {
                console.log(`Validando creador: ${v}`);  // Log para depuración
                return mongoose.Types.ObjectId.isValid(v);  // Valida que sea un ObjectId válido
            },
            message: 'El ID del creador no es válido'
        }
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: function(v) {
                if (!v) return true;  // Es opcional, puede ser null/undefined
                console.log(`Validando actualizador: ${v}`);  // Log para depuración
                return mongoose.Types.ObjectId.isValid(v);  // Valida que sea un ObjectId válido
            },
            message: 'El ID del actualizador no es válido'
        }
    }
}, {
    timestamps: true,  // Agrega campos createdAt y updatedAt automáticamente
    versionKey: false  // Desactiva el campo __v de versionado
});

// Middleware previo a eliminar un tipo de personal
staffTypeSchema.pre('remove', async function(next) {
    console.log(`Intentando eliminar tipo de personal con ID: ${this._id}`);  // Log para depuración
    
    try {
        // Verifica si hay usuarios asociados a este tipo de personal
        const usersWithThisType = await mongoose.model('User').countDocuments({ 
            staffTypeId: this._id 
        });
        
        console.log(`Usuarios encontrados con este tipo: ${usersWithThisType}`);  // Log para depuración
        
        if (usersWithThisType > 0) {
            console.error('No se puede eliminar: hay personal asignado a esta categoría');  // Log de error
            throw new Error('No se puede eliminar: hay personal asignado a esta categoría');
        }
        
        next();
    } catch (error) {
        console.error(`Error en pre-remove middleware: ${error.message}`);  // Log de error
        next(error);
    }
});

/**
 * Método para obtener personal activo asociado a este tipo de personal
 * @returns {Promise<Array>} Lista de usuarios activos
 */
staffTypeSchema.methods.getActiveStaff = async function() {
    console.log(`Obteniendo personal activo para tipo: ${this._id}`);  // Log para depuración
    try {
        const activeStaff = await mongoose.model('User').find({ 
            staffTypeId: this._id, 
            status: 'active' 
        }).select('-password');  // Excluye el campo password de los resultados
        
        console.log(`Personal activo encontrado: ${activeStaff.length}`);  // Log para depuración
        return activeStaff;
    } catch (error) {
        console.error(`Error al obtener personal activo: ${error.message}`);  // Log de error
        throw error;
    }
};

// Exporta el modelo para su uso en otras partes de la aplicación
module.exports = mongoose.model('StaffType', staffTypeSchema);