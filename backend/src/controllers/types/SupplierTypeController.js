const SupplierType = require('../../models/types/SupplierType');
const { validationResult } = require('express-validator');

/**
 * Obtener todas las categorías principales únicas
 */
exports.getMainCategories = async (req, res) => {
  try {
    const mainCategories = await SupplierType.getMainCategories();
    res.status(200).json(mainCategories);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener categorías principales',
      error: error.message 
    });
  }
};

/**
 * Obtener subcategorías por categoría principal
 */
exports.getSubcategories = async (req, res) => {
  const { mainCategory } = req.params;

  try {
    const subcategories = await SupplierType.getSubcategories(mainCategory);
    if (subcategories.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontraron subcategorías para esta categoría principal' 
      });
    }
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener subcategorías',
      error: error.message 
    });
  }
};

/**
 * Crear una nueva subcategoría
 */
exports.createSubcategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mainCategory, subCategory, description, icon } = req.body;

  try {
    const newSubcategory = await SupplierType.addSubcategory(
      mainCategory,
      subCategory,
      description,
      icon
    );
    res.status(201).json({
      message: 'Subcategoría creada exitosamente',
      data: newSubcategory
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al crear subcategoría',
      error: error.message 
    });
  }
};

/**
 * Actualizar una subcategoría existente
 */
exports.updateSubcategory = async (req, res) => {
  const { id } = req.params;
  const { subCategory, description, icon, status } = req.body;

  try {
    const updatedSubcategory = await SupplierType.findByIdAndUpdate(
      id,
      { subCategory, description, icon, status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedSubcategory) {
      return res.status(404).json({ message: 'Subcategoría no encontrada' });
    }

    res.status(200).json({
      message: 'Subcategoría actualizada',
      data: updatedSubcategory
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar subcategoría',
      error: error.message 
    });
  }
};

/**
 * Eliminar una subcategoría (cambio de estado a "inactive")
 */
exports.deleteSubcategory = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSubcategory = await SupplierType.findByIdAndUpdate(
      id,
      { status: 'inactive', updatedAt: Date.now() },
      { new: true }
    );

    if (!deletedSubcategory) {
      return res.status(404).json({ message: 'Subcategoría no encontrada' });
    }

    res.status(200).json({
      message: 'Subcategoría desactivada',
      data: deletedSubcategory
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al desactivar subcategoría',
      error: error.message 
    });
  }
};

/**
 * Obtener todas las subcategorías (con filtros opcionales)
 */
exports.getAllSubcategories = async (req, res) => {
  const { status, mainCategory } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (mainCategory) filter.mainCategory = mainCategory;

  try {
    const subcategories = await SupplierType.find(filter)
      .sort({ mainCategory: 1, subCategory: 1 });
    
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener subcategorías',
      error: error.message 
    });
  }
};