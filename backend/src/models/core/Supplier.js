const mongoose = require('mongoose');

/**
 * Esquema para el modelo de Proveedores
 * Define la estructura de datos, validaciones y comportamientos de los proveedores
 */
const supplierSchema = new mongoose.Schema({
  // ID único del proveedor (entero requerido)
  supplier_id: { 
    type: Number, 
    required: [true, 'El ID del proveedor es obligatorio'], 
    unique: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} debe ser un número entero'
    }
  },
  
  // Nombre del proveedor (string requerido)
  name: { 
    type: String, 
    required: [true, 'El nombre del proveedor es obligatorio'],
    trim: true,
    maxlength: [45, 'El nombre no puede exceder los 45 caracteres']
  },
  
  // Teléfono del proveedor (validación de formato)
  phone: { 
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    validate: {
      validator: function(v) {
        return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(v);
      },
      message: props => `"${props.value}" no es un número de teléfono válido`
    }
  },
  
  // Email del proveedor (validación de formato)
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `"${props.value}" no es un email válido`
    }
  },
  
  // Disponibilidad del proveedor (valores predefinidos)
  availability: {
    type: String,
    required: true,
    enum: {
      values: ['available', 'unavailable', 'limited'],
      message: 'La disponibilidad debe ser: available, unavailable o limited'
    },
    default: 'available'
  },
  
  // Referencia al tipo de proveedor
  supplier_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupplierType',
    required: [true, 'El tipo de proveedor es obligatorio']
  },
  
  // Dirección del proveedor (opcional)
  address: {
    type: String,
    trim: true
  },
  
  // Fecha de registro (autogenerada)  ejemplo
  registration_date: {
    type: Date,
    default: Date.now
  },
  
  // Especialidades del proveedor (array de strings)
  specialties: [{
    type: String,
    trim: true
  }],
  
  // Calificación del proveedor (rango 1-5)
  rating: {
    type: Number,
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5'],
    default: 3
  }
}, {
  // Opciones del esquema
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar búsquedas frecuentes
supplierSchema.index({ name: 'text', specialties: 'text' }); // Búsqueda por texto
supplierSchema.index({ supplier_type: 1 });                 // Búsqueda por tipo
supplierSchema.index({ availability: 1 });                  // Búsqueda por disponibilidad

/**
 * Middleware para validar la existencia del tipo de proveedor antes de guardar
 */
supplierSchema.pre('save', async function(next) {
  console.log(`[Supplier] Validando tipo de proveedor para ${this.name}`);
  
  try {
    const typeExists = await mongoose.model('SupplierType').exists({ _id: this.supplier_type });
    if (!typeExists) {
      console.log(`[Supplier] Error: Tipo de proveedor no encontrado (ID: ${this.supplier_type})`);
      throw new Error('El tipo de proveedor especificado no existe');
    }
    next();
  } catch (error) {
    console.error(`[Supplier] Error en validación: ${error.message}`);
    next(error);
  }
});

/**
 * Middleware para limpiar referencias antes de eliminar
 */
supplierSchema.pre('remove', async function(next) {
  console.log(`[Supplier] Limpiando referencias del proveedor ${this._id}`);
  // Aquí podrías añadir lógica para limpiar relaciones si es necesario
  next();
});

/**
 * Virtual para acceder a eventos relacionados (si tu modelo los tiene)
 */
supplierSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'suppliers',
  justOne: false
});

// Creación del modelo
const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;