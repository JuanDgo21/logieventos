const SupplierType = require('../../models/types/SupplierType');
const Supplier = require('../../models/core/Supplier');

class SupplierTypeController {
  // Middleware para verificar permisos
  static async checkPermissions(req, res, next) {
    const { id } = req.params;
    const { userRole } = req;
    
    // Coordinador no puede eliminar
    if (req.method === 'DELETE' && userRole === 'coordinador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar tipos'
      });
    }
    
    // Líder solo puede leer
    if (userRole === 'lider' && !['GET', 'HEAD'].includes(req.method)) {
      return res.status(403).json({
        success: false,
        message: 'Solo tienes permiso para consultar'
      });
    }
    
    // Para operaciones de actualización/eliminación, verificar creador
    if (['PUT', 'PATCH', 'DELETE'].includes(req.method) && userRole === 'coordinador') {
      const type = await SupplierType.findById(id);
      if (!type) {
        return res.status(404).json({
          success: false,
          message: 'Tipo no encontrado'
        });
      }
      
      if (type.createdBy.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes modificar tipos que hayas creado'
        });
      }
    }
    
    next();
  }

  /**
   * Crear nuevo tipo
   */
  static async create(req, res) {
    try {
      const { mainCategory, subCategory } = req.body;

      if (!['admin', 'coordinador'].includes(req.userRole)) {
        return res.status(403).json({ 
          success: false,
          message: 'No tienes permiso para crear tipos' 
        });
      }

      if (!mainCategory || !subCategory) {
        return res.status(400).json({
          success: false,
          message: 'mainCategory y subCategory son requeridos'
        });
      }

      const newType = await SupplierType.addSubcategory(
        mainCategory, 
        subCategory, 
        req.userId
      );

      res.status(201).json({
        success: true,
        message: 'Tipo creado exitosamente',
        data: newType
      });

    } catch (error) {
      const status = error.message.includes('ya existe') ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener todos los tipos
   */
  static async getAll(req, res) {
    try {
      const types = await SupplierType.find({ status: 'active' })
        .sort({ mainCategory: 1, subCategory: 1 });

      res.json({
        success: true,
        count: types.length,
        data: types
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos'
      });
    }
  }

  /**
   * Obtener categorías principales
   */
  static async getMainCategories(req, res) {
    try {
      const categories = await SupplierType.getMainCategories();
      
      res.json({
        success: true,
        count: categories.length,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener categorías'
      });
    }
  }

  /**
   * Obtener subcategorías
   */
  static async getSubcategories(req, res) {
    try {
      const { mainCategory } = req.params;
      
      if (!mainCategory) {
        return res.status(400).json({
          success: false,
          message: 'mainCategory es requerido'
        });
      }

      const subcategories = await SupplierType.getSubcategories(mainCategory);
      
      res.json({
        success: true,
        count: subcategories.length,
        data: subcategories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener subcategorías'
      });
    }
  }

  /**
   * Obtener tipo por ID
   */
  static async getById(req, res) {
    try {
      const type = await SupplierType.findById(req.params.id);
      
      if (!type) {
        return res.status(404).json({
          success: false,
          message: 'Tipo no encontrado'
        });
      }

      res.json({
        success: true,
        data: type
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo'
      });
    }
  }

  /**
   * Actualizar tipo
   */
  static async update(req, res) {
    try {
      if (!['admin', 'coordinador'].includes(req.userRole)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar tipos'
        });
      }

      // Verificar proveedores asociados
      const suppliersCount = await Supplier.countDocuments({ 
        supplierType: req.params.id 
      });
      
      if (suppliersCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede modificar con proveedores asociados'
        });
      }

      const updatedType = await SupplierType.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!updatedType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Tipo actualizado',
        data: updatedType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar tipo'
      });
    }
  }

  /**
   * Desactivar tipo
   */
  static async deactivate(req, res) {
    try {
      if (!['admin', 'coordinador'].includes(req.userRole)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para desactivar tipos'
        });
      }

      // Verificar proveedores activos
      const activeSuppliers = await Supplier.countDocuments({ 
        supplierType: req.params.id,
        status: 'active'
      });
      
      if (activeSuppliers > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede desactivar con ${activeSuppliers} proveedores activos`
        });
      }

      const deactivatedType = await SupplierType.findByIdAndUpdate(
        req.params.id,
        { status: 'inactive' },
        { new: true }
      );

      if (!deactivatedType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Tipo desactivado',
        data: deactivatedType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al desactivar tipo'
      });
    }
  }

  /**
   * Eliminar tipo (Solo admin)
   */
  static async delete(req, res) {
    try {
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden eliminar tipos'
        });
      }

      // Verificar proveedores asociados
      const suppliersCount = await Supplier.countDocuments({ 
        supplierType: req.params.id 
      });
      
      if (suppliersCount > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar con ${suppliersCount} proveedores asociados`
        });
      }

      const deletedType = await SupplierType.findByIdAndDelete(req.params.id);

      if (!deletedType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Tipo eliminado',
        data: deletedType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo'
      });
    }
  }

  /**
   * Obtener proveedores por tipo
   */
  static async getSuppliersByType(req, res) {
    try {
      const type = await SupplierType.findById(req.params.id);
      
      if (!type) {
        return res.status(404).json({
          success: false,
          message: 'Tipo no encontrado'
        });
      }

      // Filtro para líderes (solo activos)
      const statusFilter = req.userRole === 'lider' ? { status: 'active' } : {};

      const suppliers = await Supplier.find({
        supplierType: req.params.id,
        ...statusFilter
      }).select('-__v');

      res.json({
        success: true,
        count: suppliers.length,
        type: {
          mainCategory: type.mainCategory,
          subCategory: type.subCategory
        },
        suppliers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener proveedores'
      });
    }
  }
}

module.exports = SupplierTypeController;

// :3