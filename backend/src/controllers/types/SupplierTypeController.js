const SupplierType = require('../../models/types/SupplierType');
const Supplier = require('../../models/core/Supplier');

/**
 * Controlador para gestionar las operaciones CRUD de tipos de proveedores.
 */
const SupplierTypeController = {
  /**
   * Crea un nuevo tipo de proveedor
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async create(req, res) {
    try {
      console.log('[SupplierType] Creando nuevo tipo de proveedor:', req.body);
      
      const supplierType = new SupplierType(req.body);
      await supplierType.save();
      
      console.log('[SupplierType] Tipo de proveedor creado:', supplierType);
      res.status(201).json(supplierType);
    } catch (error) {
      console.error('[SupplierType] Error al crear:', error.message);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Obtiene todos los tipos de proveedores
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getAll(req, res) {
    try {
      console.log('[SupplierType] Obteniendo todos los tipos de proveedores');
      
      // Opciones de consulta: filtrar por estado si se proporciona
      const filter = {};
      if (req.query.status) {
        filter.status = req.query.status;
      }
      
      const supplierTypes = await SupplierType.find(filter).sort({ created_at: -1 });
      
      console.log(`[SupplierType] Encontrados ${supplierTypes.length} tipos de proveedores`);
      res.json(supplierTypes);
    } catch (error) {
      console.error('[SupplierType] Error al obtener todos:', error.message);
      res.status(500).json({ error: 'Error al obtener los tipos de proveedores' });
    }
  },

  /**
   * Obtiene un tipo de proveedor por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getById(req, res) {
    try {
      console.log(`[SupplierType] Obteniendo tipo de proveedor con ID: ${req.params.id}`);
      
      const supplierType = await SupplierType.findById(req.params.id);
      
      if (!supplierType) {
        console.log(`[SupplierType] Tipo de proveedor no encontrado: ${req.params.id}`);
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }
      
      console.log('[SupplierType] Tipo de proveedor encontrado:', supplierType);
      res.json(supplierType);
    } catch (error) {
      console.error('[SupplierType] Error al obtener por ID:', error.message);
      res.status(500).json({ error: 'Error al obtener el tipo de proveedor' });
    }
  },

  /**
   * Actualiza un tipo de proveedor
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async update(req, res) {
    try {
      console.log(`[SupplierType] Actualizando tipo de proveedor con ID: ${req.params.id}`, req.body);
      
      const supplierType = await SupplierType.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
      );
      
      if (!supplierType) {
        console.log(`[SupplierType] Tipo de proveedor no encontrado para actualizar: ${req.params.id}`);
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }
      
      console.log('[SupplierType] Tipo de proveedor actualizado:', supplierType);
      res.json(supplierType);
    } catch (error) {
      console.error('[SupplierType] Error al actualizar:', error.message);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Elimina un tipo de proveedor
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async delete(req, res) {
    try {
      console.log(`[SupplierType] Eliminando tipo de proveedor con ID: ${req.params.id}`);
      
      // Verificar si hay proveedores asociados
      const suppliersCount = await Supplier.countDocuments({ supplier_type: req.params.id });
      
      if (suppliersCount > 0) {
        console.log(`[SupplierType] Error: Hay ${suppliersCount} proveedores asociados`);
        return res.status(400).json({ 
          error: `No se puede eliminar el tipo de proveedor porque tiene ${suppliersCount} proveedor(es) asociado(s)`
        });
      }
      
      const supplierType = await SupplierType.findByIdAndDelete(req.params.id);
      
      if (!supplierType) {
        console.log(`[SupplierType] Tipo de proveedor no encontrado para eliminar: ${req.params.id}`);
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }
      
      console.log('[SupplierType] Tipo de proveedor eliminado:', supplierType);
      res.json({ message: 'Tipo de proveedor eliminado correctamente' });
    } catch (error) {
      console.error('[SupplierType] Error al eliminar:', error.message);
      res.status(500).json({ error: 'Error al eliminar el tipo de proveedor' });
    }
  },

  /**
   * Obtiene todos los proveedores de un tipo específico
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getSuppliersByType(req, res) {
    try {
      console.log(`[SupplierType] Obteniendo proveedores para tipo: ${req.params.id}`);
      
      const supplierType = await SupplierType.findById(req.params.id).populate('suppliers');
      
      if (!supplierType) {
        console.log(`[SupplierType] Tipo de proveedor no encontrado: ${req.params.id}`);
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }
      
      console.log(`[SupplierType] Encontrados ${supplierType.suppliers.length} proveedores para el tipo ${req.params.id}`);
      res.json(supplierType.suppliers);
    } catch (error) {
      console.error('[SupplierType] Error al obtener proveedores por tipo:', error.message);
      res.status(500).json({ error: 'Error al obtener los proveedores del tipo' });
    }
  }
};

module.exports = SupplierTypeController;