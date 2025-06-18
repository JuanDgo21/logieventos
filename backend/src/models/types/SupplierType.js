const mongoose = require('mongoose');

/**
 * Esquema para los tipos de proveedores en el sistema.
 * Define la estructura de datos y validaciones para las categorías de proveedores.
 */
const supplierTypeSchema = new mongoose.Schema({
  // ID único del tipo de proveedor (entero)
  supplier_type_id: { 
    type: Number, 
    required: [true, 'El ID del tipo de proveedor es requerido'], 
    unique: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} no es un valor entero válido'
    }
  },
  
  // Nombre del tipo de proveedor
  name: { 
    type: String, 
    required: [true, 'El nombre del tipo de proveedor es requerido'],
    trim: true,
    maxlength: [45, 'El nombre no puede exceder los 45 caracteres'],
    minlength: [3, 'El nombre debe tener al menos 3 caracteres']
  },
  
  // Fecha de creación (se autogenera)
  created_at: {
    type: Date,
    default: Date.now
  },
  
  // Estado del tipo de proveedor (activo/inactivo)
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'El estado debe ser "active" o "inactive"'
    },
    default: 'active'
  },
  
  // Descripción opcional del tipo de proveedor
  description: {
    type: String,
    trim: true,
    maxlength: [255, 'La descripción no puede exceder los 255 caracteres']
  }
}, {
  // Opciones del esquema
  versionKey: false, // Elimina el campo __v
  timestamps: false, // Desactiva createdAt y updatedAt (usamos created_at personalizado)
  toJSON: { virtuals: true }, // Incluye virtuals al convertir a JSON
  toObject: { virtuals: true }
});

/**
 * Relación virtual con los proveedores de este tipo.
 * Permite acceder a todos los proveedores asociados a este tipo.
 */
supplierTypeSchema.virtual('suppliers', {
  ref: 'Supplier', // Modelo relacionado
  localField: '_id', // Campo en este modelo
  foreignField: 'supplier_type', // Campo en el modelo relacionado
  justOne: false // Relación uno a muchos
});

/**
 * Middleware que se ejecuta antes de eliminar un tipo de proveedor.
 * Limpia las referencias en los proveedores asociados.
 */
supplierTypeSchema.pre('remove', async function(next) {
  console.log(`[SupplierType] Limpiando referencias de tipo de proveedor ${this._id} en proveedores...`);
  
  try {
    await mongoose.model('Supplier').updateMany(
      { supplier_type: this._id },
      { $unset: { supplier_type: 1 } }
    );
    console.log(`[SupplierType] Referencias limpiadas exitosamente para ${this._id}`);
    next();
  } catch (error) {
    console.error(`[SupplierType] Error limpiando referencias: ${error.message}`);
    next(error);
  }
});

/**
 * Middleware para validar que no haya proveedores asociados antes de desactivar
 */
supplierTypeSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'inactive') {
    console.log(`[SupplierType] Validando proveedores activos para el tipo ${this._id}`);
    
    const activeSuppliersCount = await mongoose.model('Supplier').countDocuments({
      supplier_type: this._id,
      status: 'active'
    });
    
    if (activeSuppliersCount > 0) {
      console.log(`[SupplierType] Error: Hay ${activeSuppliersCount} proveedores activos asociados`);
      throw new Error(`No se puede desactivar el tipo de proveedor porque tiene ${activeSuppliersCount} proveedores activos asociados`);
    }
  }
  next();
});

// Creación del modelo
const SupplierType = mongoose.model('SupplierType', supplierTypeSchema);

module.exports = SupplierType;