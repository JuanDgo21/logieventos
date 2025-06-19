const mongoose = require('mongoose');

/**
 * Esquema para proveedores concretos
 */
const supplierSchema = new mongoose.Schema({
  // Referencia al tipo/subcategoría
  supplierType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupplierType',
    required: true
  },
  
  // Datos básicos
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Información de contacto
  contact: {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: String,
    contactPerson: String,
    website: String
  },
  
  // Estado
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_review'],
    default: 'pending_review'
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  versionKey: false
});

// Middleware para validar referencia al tipo
supplierSchema.pre('save', async function(next) {
  if (this.supplierType) {
    const typeExists = await mongoose.model('SupplierType').exists({ 
      _id: this.supplierType,
      status: 'active'
    });
    if (!typeExists) {
      throw new Error('El tipo de proveedor no existe o está inactivo');
    }
  }
  next();
});

// Middleware para actualizar fecha de modificación
supplierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Métodos estáticos para gestión de proveedores
 */
supplierSchema.statics = {
  // Obtener proveedores por tipo
  async getByType(supplierTypeId) {
    return this.find({ supplierType: supplierTypeId })
      .populate('supplierType', 'mainCategory subCategory')
      .sort('name');
  },
  
  // Buscar proveedores por categoría principal
  async getByMainCategory(mainCategory) {
    const types = await mongoose.model('SupplierType')
      .find({ mainCategory }, '_id');
      
    return this.find({ 
      supplierType: { $in: types.map(t => t._id) },
      status: 'active'
    }).populate('supplierType', 'subCategory');
  }
};

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;