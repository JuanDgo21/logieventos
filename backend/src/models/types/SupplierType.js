const mongoose = require('mongoose');

const supplierTypeSchema = new mongoose.Schema({
  mainCategory: {
    type: String,
    required: true,
    enum: [
      'Proveedores de Espacios',
      'Proveedores Técnicos y de Producción',
      'Proveedores de Alimentos y Bebidas',
      'Proveedores de Decoración y Ambientación',
      'Proveedores de Vestuario y Estética',
      'Proveedores de Entretenimiento',
      'Proveedores de Logística y Servicios Generales',
      'Proveedores de Publicidad y Comunicación',
      'Proveedores de Seguridad y Emergencias',
      'Proveedores Tecnológicos'
    ],
    index: true
  },
  
  subCategory: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
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

// Índice compuesto único
supplierTypeSchema.index(
  { mainCategory: 1, subCategory: 1 }, 
  { unique: true, name: 'category_unique' }
);

// Actualizar fecha de modificación
supplierTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Métodos estáticos
supplierTypeSchema.statics = {
  async getMainCategories() {
    return this.distinct('mainCategory').sort();
  },
  
  async getSubcategories(mainCategory) {
    return this.find({ mainCategory, status: 'active' })
      .select('subCategory')
      .sort('subCategory');
  },
  
  async addSubcategory(mainCategory, subCategory, userId) {
    const existing = await this.findOne({ mainCategory, subCategory });
    if (existing) {
      throw new Error('Esta subcategoría ya existe para la categoría principal');
    }
    
    return this.create({
      mainCategory,
      subCategory,
      createdBy: userId
    });
  }
};

const SupplierType = mongoose.model('SupplierType', supplierTypeSchema);

module.exports = SupplierType;