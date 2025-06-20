const Supplier = require('../../models/core/supplier');
const SupplierType = require('../../models/types/SupplierType');
const { validationResult } = require('express-validator');

/**
 * Obtener todos los proveedores (con filtros)
 */
exports.getAllSuppliers = async (req, res) => {
  try {
    const { status, supplierType, mainCategory } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (supplierType) filter.supplierType = supplierType;

    // Filtrar por categoría principal si se especifica
    let query = Supplier.find(filter).populate('supplierType', 'mainCategory subCategory');
    
    if (mainCategory) {
      const types = await SupplierType.find({ mainCategory }, '_id');
      query = Supplier.find({ 
        ...filter,
        supplierType: { $in: types.map(t => t._id) }
      }).populate('supplierType', 'subCategory');
    }

    const suppliers = await query.sort('name');
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener proveedores',
      error: error.message 
    });
  }
};

/**
 * Crear un nuevo proveedor (Solo Admin)
 */
exports.createSupplier = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { supplierType, name, contact, details, documents } = req.body;

    // Validar que el tipo de proveedor exista y esté activo
    const type = await SupplierType.findOne({ 
      _id: supplierType, 
      status: 'active' 
    });
    if (!type) {
      return res.status(400).json({ message: 'Tipo de proveedor no válido o inactivo' });
    }

    const newSupplier = await Supplier.create({
      supplierType,
      name,
      contact,
      details,
      documents,
      status: 'pending_review' // Estado inicial
    });

    res.status(201).json({
      message: 'Proveedor creado (pendiente de revisión)',
      data: newSupplier
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al crear proveedor',
      error: error.message 
    });
  }
};

/**
 * Obtener proveedor por ID
 */
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('supplierType', 'mainCategory subCategory');

    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener proveedor',
      error: error.message 
    });
  }
};

/**
 * Actualizar proveedor (Admin y Coordinador)
 */
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, details, documents, status } = req.body;

    // Coordinadores solo pueden actualizar ciertos campos
    if (req.user.role === 'Coordinador') {
      const allowedUpdates = { contact, details };
      const supplier = await Supplier.findByIdAndUpdate(id, allowedUpdates, { 
        new: true,
        runValidators: true 
      });
      return res.status(200).json({
        message: 'Proveedor actualizado (campos limitados para coordinadores)',
        data: supplier
      });
    }

    // Admins pueden actualizar todo
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { name, contact, details, documents, status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Proveedor actualizado',
      data: supplier
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar proveedor',
      error: error.message 
    });
  }
};

/**
 * Cambiar estado de proveedor (Solo Admin)
 */
exports.changeSupplierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'pending_review'].includes(status)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json({
      message: `Estado del proveedor actualizado a "${status}"`,
      data: supplier
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al cambiar estado',
      error: error.message 
    });
  }
};

/**
 * Obtener proveedores por tipo (Público)
 */
exports.getSuppliersByType = async (req, res) => {
  try {
    const suppliers = await Supplier.getByType(req.params.supplierTypeId);
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener proveedores por tipo',
      error: error.message 
    });
  }
};

/**
 * Obtener proveedores por categoría principal (Público)
 */
exports.getSuppliersByMainCategory = async (req, res) => {
  try {
    const suppliers = await Supplier.getByMainCategory(req.params.mainCategory);
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener proveedores por categoría',
      error: error.message 
    });
  }
};

//module.exports = SuppliersController;