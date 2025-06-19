const SupplierType = require('../../models/types/SupplierType');
const Supplier = require('../../models/core/Supplier');
const { logAction } = require('../../helpers/logger');

/**
 * Controlador para gestionar los tipos/categorías de proveedores
 */
class SupplierTypeController {
  /**
   * Crear un nuevo tipo de proveedor (Solo admin)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    try {
      console.log('[SupplierType] Iniciando creación de tipo de proveedor');
      console.log('[SupplierType] Datos recibidos:', req.body);
      console.log('[SupplierType] Usuario solicitante:', req.userId);

      // Validar permisos (solo admin puede crear tipos)
      if (req.userRole !== 'admin') {
        console.log('[SupplierType] Intento no autorizado. Rol:', req.userRole);
        return res.status(403).json({ error: 'No autorizado' });
      }

      const { mainCategory, subCategory } = req.body;

      // Verificar si ya existe
      const existingType = await SupplierType.findOne({ mainCategory, subCategory });
      if (existingType) {
        console.log('[SupplierType] Tipo ya existe:', existingType._id);
        return res.status(400).json({ error: 'Este tipo de proveedor ya existe' });
      }

      const newType = new SupplierType({
        mainCategory,
        subCategory,
        createdBy: req.userId
      });

      await newType.save();
      
      console.log('[SupplierType] Tipo creado exitosamente:', newType._id);
      await logAction(req.userId, 'CREATE_SUPPLIER_TYPE', `Nuevo tipo: ${mainCategory} > ${subCategory}`);

      res.status(201).json(newType);
    } catch (error) {
      console.error('[SupplierType] Error al crear:', error.message);
      res.status(500).json({ error: 'Error al crear el tipo de proveedor' });
    }
  }

  /**
   * Obtener todos los tipos de proveedores (Todos los roles)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      console.log('[SupplierType] Obteniendo todos los tipos de proveedores');
      console.log('[SupplierType] Rol del usuario:', req.userRole);

      const types = await SupplierType.find({ status: 'active' })
        .sort({ mainCategory: 1, subCategory: 1 });

      // Para coordinadores, mostrar solo tipos relevantes a sus permisos
      if (req.userRole === 'coordinator') {
        const allowedCategories = [
          'Proveedores Técnicos y de Producción',
          'Proveedores de Alimentos y Bebidas',
          'Proveedores de Decoración y Ambientación'
        ];
        
        const filteredTypes = types.filter(type => 
          allowedCategories.includes(type.mainCategory)
        );
        
        console.log('[SupplierType] Tipos filtrados para coordinador:', filteredTypes.length);
        return res.json(filteredTypes);
      }

      // Para líderes, mostrar solo tipos básicos
      if (req.userRole === 'lider') {
        const basicTypes = types.map(type => ({
          _id: type._id,
          mainCategory: type.mainCategory,
          subCategory: type.subCategory
        }));
        
        console.log('[SupplierType] Tipos básicos para líder:', basicTypes.length);
        return res.json(basicTypes);
      }

      // admin ve todo
      console.log('[SupplierType] Total de tipos encontrados:', types.length);
      res.json(types);
    } catch (error) {
      console.error('[SupplierType] Error al obtener tipos:', error.message);
      res.status(500).json({ error: 'Error al obtener tipos de proveedores' });
    }
  }

  /**
   * Obtener un tipo específico por ID (Todos los roles)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      console.log('[SupplierType] Obteniendo tipo por ID:', id);

      const type = await SupplierType.findById(id);
      if (!type) {
        console.log('[SupplierType] Tipo no encontrado');
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }

      // Verificar permisos para ver detalles completos
      if (req.userRole === 'lider' && type.mainCategory === 'Proveedores de Seguridad y Emergencias') {
        console.log('[SupplierType] Líder no puede ver detalles de seguridad');
        return res.status(403).json({ error: 'No autorizado para este tipo' });
      }

      console.log('[SupplierType] Tipo encontrado:', type.subCategory);
      res.json(type);
    } catch (error) {
      console.error('[SupplierType] Error al obtener tipo:', error.message);
      res.status(500).json({ error: 'Error al obtener el tipo de proveedor' });
    }
  }

  /**
   * Actualizar un tipo de proveedor (Solo admin)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      console.log('[SupplierType] Iniciando actualización de tipo:', id);
      console.log('[SupplierType] Datos a actualizar:', req.body);

      if (req.userRole !== 'admin') {
        console.log('[SupplierType] Intento no autorizado. Rol:', req.userRole);
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Verificar si hay proveedores asociados antes de cambiar categoría
      if (req.body.mainCategory || req.body.subCategory) {
        const suppliersCount = await Supplier.countDocuments({ supplierType: id });
        if (suppliersCount > 0) {
          console.log('[SupplierType] No se puede modificar. Proveedores asociados:', suppliersCount);
          return res.status(400).json({ 
            error: 'No se puede modificar el tipo con proveedores asociados' 
          });
        }
      }

      const updatedType = await SupplierType.findByIdAndUpdate(
        id, 
        req.body, 
        { new: true, runValidators: true }
      );

      if (!updatedType) {
        console.log('[SupplierType] Tipo no encontrado para actualizar');
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }

      console.log('[SupplierType] Tipo actualizado exitosamente');
      await logAction(req.userId, 'UPDATE_SUPPLIER_TYPE', `Actualizado: ${updatedType.mainCategory} > ${updatedType.subCategory}`);

      res.json(updatedType);
    } catch (error) {
      console.error('[SupplierType] Error al actualizar:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Desactivar un tipo de proveedor (Solo admin)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deactivate(req, res) {
    try {
      const { id } = req.params;
      console.log('[SupplierType] Iniciando desactivación de tipo:', id);

      if (req.userRole !== 'admin') {
        console.log('[SupplierType] Intento no autorizado. Rol:', req.userRole);
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Verificar proveedores activos asociados
      const activeSuppliers = await Supplier.countDocuments({ 
        supplierType: id,
        status: 'active'
      });

      if (activeSuppliers > 0) {
        console.log('[SupplierType] No se puede desactivar. Proveedores activos:', activeSuppliers);
        return res.status(400).json({ 
          error: `No se puede desactivar con ${activeSuppliers} proveedores activos asociados` 
        });
      }

      const deactivatedType = await SupplierType.findByIdAndUpdate(
        id,
        { status: 'inactive' },
        { new: true }
      );

      if (!deactivatedType) {
        console.log('[SupplierType] Tipo no encontrado para desactivar');
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }

      console.log('[SupplierType] Tipo desactivado exitosamente');
      await logAction(req.userId, 'DEACTIVATE_SUPPLIER_TYPE', `Desactivado: ${deactivatedType.mainCategory} > ${deactivatedType.subCategory}`);

      res.json({ 
        message: 'Tipo desactivado correctamente',
        type: deactivatedType 
      });
    } catch (error) {
      console.error('[SupplierType] Error al desactivar:', error.message);
      res.status(500).json({ error: 'Error al desactivar el tipo de proveedor' });
    }
  }

  /**
   * Obtener proveedores por tipo (Roles con permisos)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getSuppliersByType(req, res) {
    try {
      const { id } = req.params;
      console.log('[SupplierType] Obteniendo proveedores para tipo:', id);
      console.log('[SupplierType] Rol del usuario:', req.userRole);

      const type = await SupplierType.findById(id);
      if (!type) {
        console.log('[SupplierType] Tipo no encontrado');
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }

      // Validar permisos según el tipo de proveedor
      if (req.userRole === 'coordinator') {
        const allowedCategories = [
          'Proveedores Técnicos y de Producción',
          'Proveedores de Alimentos y Bebidas',
          'Proveedores de Decoración y Ambientación'
        ];
        
        if (!allowedCategories.includes(type.mainCategory)) {
          console.log('[SupplierType] coordinador no autorizado para este tipo');
          return res.status(403).json({ error: 'No autorizado para este tipo de proveedor' });
        }
      }

      // Líderes solo ven proveedores activos
      const statusFilter = req.userRole === 'lider' ? { status: 'active' } : {};

      const suppliers = await Supplier.find({ 
        supplierType: id,
        ...statusFilter
      }).select('-__v -createdAt -updatedAt');

      console.log(`[SupplierType] Proveedores encontrados: ${suppliers.length}`);
      res.json({
        type: {
          mainCategory: type.mainCategory,
          subCategory: type.subCategory
        },
        suppliers
      });
    } catch (error) {
      console.error('[SupplierType] Error al obtener proveedores:', error.message);
      res.status(500).json({ error: 'Error al obtener proveedores por tipo' });
    }
  }
}

module.exports = SupplierTypeController;