const mongoose = require('mongoose');

/**
 * Esquema para tipos/categorías de proveedores
 * Combina categorías principales y subcategorías en una sola estructura
 */
const supplierTypeSchema = new mongoose.Schema({
  // Nivel 1: Categoría principal (ej. "Equipamiento Técnico")
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
  
  // Nivel 2: Subcategoría específica (ej. "Sonido profesional")
  subCategory: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  // Icono representativo
  icon: {
    type: String,
    default: '🏛️',
    maxlength: 2
  },
  
  // Descripción detallada
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Estado
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Fechas de creación y actualización
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice compuesto para evitar duplicados
supplierTypeSchema.index(
  { mainCategory: 1, subCategory: 1 }, 
  { unique: true, name: 'category_unique' }
);

// Middleware para actualizar fecha de modificación
supplierTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Relación virtual con proveedores
supplierTypeSchema.virtual('suppliers', {
  ref: 'Supplier',
  localField: '_id',
  foreignField: 'supplierType',
  justOne: false
});

/**
 * Métodos estáticos para gestión de categorías
 */
supplierTypeSchema.statics = {
  // Obtener todas las categorías principales únicas
  async getMainCategories() {
    return this.aggregate([
      { $group: { _id: '$mainCategory', icon: { $first: '$icon' } } },
      { $sort: { _id: 1 } }
    ]);
  },
  
  // Obtener subcategorías de una categoría principal
  async getSubcategories(mainCategory) {
    return this.find({ mainCategory, status: 'active' })
      .select('subCategory description')
      .sort('subCategory');
  },
  
  // Añadir nueva subcategoría
  async addSubcategory(mainCategory, subCategory, description = '', icon = '🏛️') {
    const existing = await this.findOne({ mainCategory, subCategory });
    if (existing) {
      throw new Error('Subcategoría ya existe para esta categoría principal');
    }
    
    return this.create({
      mainCategory,
      subCategory,
      description,
      icon
    });
  }
};

const SupplierType = mongoose.model('SupplierType', supplierTypeSchema);

module.exports = SupplierType;