const Supplier = require('../../models/core/Supplier');
const SupplierType = require('../../models/types/SupplierType');
const Contract = require('../../models/core/Contract');
const { logAction } = require('../../helpers/logger');

console.log('[Suppliers] Inicializando controlador de proveedores');

/**
 * Controlador para la gestión de proveedores
 */
class SuppliersController {
  /**
   * Crear un nuevo proveedor (Admin o Coordinador con aprobación pendiente)
   */
  static async create(req, res) {
    try {
      console.log('[Suppliers] Iniciando creación de proveedor');
      console.log('[Suppliers] Usuario:', req.user._id, 'Rol:', req.user.role);
      console.log('[Suppliers] Datos recibidos:', req.body);

      const { supplierType, name, contact, details } = req.body;

      // Validar que el tipo de proveedor exista
      const typeExists = await SupplierType.findById(supplierType);
      if (!typeExists) {
        console.log('[Suppliers] Tipo de proveedor no encontrado');
        return res.status(400).json({ error: 'Tipo de proveedor no válido' });
      }

      // Configurar estado según rol
      let status = 'pending_approval';
      if (req.user.role === 'Admin') {
        status = 'active';
      }

      const newSupplier = new Supplier({
        supplierType,
        name,
        contact,
        details,
        status,
        createdBy: req.user._id
      });

      await newSupplier.save();

      console.log('[Suppliers] Proveedor creado con ID:', newSupplier._id);
      await logAction(
        req.user._id, 
        'SUPPLIER_CREATE', 
        `Nuevo proveedor: ${name} (${typeExists.subCategory})`
      );

      res.status(201).json({
        ...newSupplier.toObject(),
        message: req.user.role === 'Admin' 
          ? 'Proveedor creado y activado' 
          : 'Proveedor creado, pendiente de aprobación'
      });
    } catch (error) {
      console.error('[Suppliers] Error al crear proveedor:', error.message);
      res.status(500).json({ error: 'Error al crear proveedor' });
    }
  }

  /**
   * Obtener todos los proveedores (filtrados por rol)
   */
  static async getAll(req, res) {
    try {
      console.log('[Suppliers] Obteniendo proveedores');
      console.log('[Suppliers] Usuario:', req.user._id, 'Rol:', req.user.role);

      let query = {};
      let projection = {};

      // Filtros para Coordinador
      if (req.user.role === 'Coordinador') {
        const allowedTypes = await SupplierType.find({
          mainCategory: { 
            $in: ['Equipamiento Técnico', 'Mobiliario', 'Gastronomía', 'Ambientación'] 
          }
        }).select('_id');

        query = {
          supplierType: { $in: allowedTypes.map(t => t._id) },
          status: 'active'
        };
        projection = { details: 1, name: 1, contact: 1, supplierType: 1, rating: 1 };
      }

      // Filtros para Líder (solo activos)
      if (req.user.role === 'Líder') {
        query = { status: 'active' };
        projection = { name: 1, contact: { phone: 1, contactPerson: 1 }, supplierType: 1 };
      }

      const suppliers = await Supplier.find(query)
        .select(projection)
        .populate('supplierType', 'mainCategory subCategory');

      console.log(`[Suppliers] Total proveedores encontrados: ${suppliers.length}`);
      res.json(suppliers);
    } catch (error) {
      console.error('[Suppliers] Error al obtener proveedores:', error.message);
      res.status(500).json({ error: 'Error al obtener proveedores' });
    }
  }

  /**
   * Obtener un proveedor específico
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      console.log(`[Suppliers] Obteniendo proveedor ID: ${id}`);
      console.log('[Suppliers] Usuario:', req.user._id, 'Rol:', req.user.role);

      const supplier = await Supplier.findById(id)
        .populate('supplierType', 'mainCategory subCategory');

      if (!supplier) {
        console.log('[Suppliers] Proveedor no encontrado');
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Validar acceso según rol
      if (req.user.role === 'Líder' && supplier.status !== 'active') {
        console.log('[Suppliers] Líder no puede ver proveedores inactivos');
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Limitar datos para Coordinador
      let supplierData = supplier.toObject();
      if (req.user.role === 'Coordinador') {
        delete supplierData.documents;
        delete supplierData.internalNotes;
      }

      console.log('[Suppliers] Proveedor encontrado:', supplier.name);
      res.json(supplierData);
    } catch (error) {
      console.error('[Suppliers] Error al obtener proveedor:', error.message);
      res.status(500).json({ error: 'Error al obtener proveedor' });
    }
  }

  /**
   * Actualizar proveedor (Admin: completo, Coordinador: parcial)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      console.log(`[Suppliers] Actualizando proveedor ID: ${id}`);
      console.log('[Suppliers] Usuario:', req.user._id, 'Rol:', req.user.role);
      console.log('[Suppliers] Cambios solicitados:', req.body);

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        console.log('[Suppliers] Proveedor no encontrado');
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Validar permisos
      if (req.user.role === 'Líder') {
        console.log('[Suppliers] Líder no puede modificar proveedores');
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Coordinador solo puede actualizar ciertos campos
      if (req.user.role === 'Coordinador') {
        const allowedFields = ['contact', 'details.menuOptions', 'details.equipmentSpecs'];
        Object.keys(req.body).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete req.body[key];
          }
        });
        console.log('[Suppliers] Campos permitidos para Coordinador:', req.body);
      }

      const updatedSupplier = await Supplier.findByIdAndUpdate(
        id, 
        req.body, 
        { new: true, runValidators: true }
      );

      console.log('[Suppliers] Proveedor actualizado');
      await logAction(
        req.user._id, 
        'SUPPLIER_UPDATE', 
        `Actualizado proveedor: ${updatedSupplier.name}`
      );

      res.json(updatedSupplier);
    } catch (error) {
      console.error('[Suppliers] Error al actualizar proveedor:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Aprobar/Rechazar proveedor (Solo Admin)
   */
  static async approve(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      console.log(`[Suppliers] Cambiando estado proveedor ID: ${id} a ${status}`);
      console.log('[Suppliers] Usuario:', req.user._id, 'Rol:', req.user.role);

      if (req.user.role !== 'Admin') {
        console.log('[Suppliers] Solo Admin puede aprobar/rechazar');
        return res.status(403).json({ error: 'No autorizado' });
      }

      if (!['active', 'rejected'].includes(status)) {
        console.log('[Suppliers] Estado no válido');
        return res.status(400).json({ error: 'Estado no válido' });
      }

      const updatedSupplier = await Supplier.findByIdAndUpdate(
        id,
        { 
          status,
          approvalDate: status === 'active' ? new Date() : null,
          rejectionReason: status === 'rejected' ? reason : null
        },
        { new: true }
      );

      if (!updatedSupplier) {
        console.log('[Suppliers] Proveedor no encontrado');
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const action = status === 'active' ? 'APROBADO' : 'RECHAZADO';
      console.log(`[Suppliers] Proveedor ${action}: ${updatedSupplier.name}`);
      await logAction(
        req.user._id, 
        `SUPPLIER_${action}`,
        `Proveedor ${action.toLowerCase()}: ${updatedSupplier.name}` +
        (reason ? ` Razón: ${reason}` : '')
      );

      res.json({
        message: `Proveedor ${action.toLowerCase()} correctamente`,
        supplier: updatedSupplier
      });
    } catch (error) {
      console.error('[Suppliers] Error al cambiar estado:', error.message);
      res.status(500).json({ error: 'Error al cambiar estado del proveedor' });
    }
  }

  /**
   * Calificar proveedor post-evento
   */
  static async rate(req, res) {
    try {
      const { id } = req.params;
      const { rating, comments } = req.body;
      console.log(`[Suppliers] Calificando proveedor ID: ${id}`);
      console.log('[Suppliers] Usuario:', req.user._id, 'Rol:', req.user.role);
      console.log('[Suppliers] Calificación:', rating, 'Comentarios:', comments);

      // Validar calificación
      if (rating < 1 || rating > 5) {
        console.log('[Suppliers] Calificación inválida');
        return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5' });
      }

      const supplier = await Supplier.findById(id);
      if (!supplier) {
        console.log('[Suppliers] Proveedor no encontrado');
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Solo líder puede calificar inicialmente
      if (req.user.role === 'Líder') {
        supplier.ratings.push({
          value: rating,
          comments,
          ratedBy: req.user._id,
          role: 'Líder'
        });
      } 
      // Admin/Coordinador puede sobreescribir
      else {
        supplier.rating = rating;
        if (comments) {
          supplier.internalNotes = comments;
        }
      }

      // Recalcular rating promedio
      if (supplier.ratings.length > 0) {
        const sum = supplier.ratings.reduce((acc, curr) => acc + curr.value, 0);
        supplier.rating = parseFloat((sum / supplier.ratings.length).toFixed(1));
      }

      await supplier.save();

      console.log(`[Suppliers] Proveedor ${supplier.name} calificado: ${supplier.rating}/5`);
      await logAction(
        req.user._id, 
        'SUPPLIER_RATE', 
        `Calificación ${rating}/5 para ${supplier.name}`
      );

      res.json({
        message: 'Calificación registrada',
        currentRating: supplier.rating
      });
    } catch (error) {
      console.error('[Suppliers] Error al calificar:', error.message);
      res.status(500).json({ error: 'Error al calificar proveedor' });
    }
  }

  /**
   * Obtener proveedores por tipo
   */
  static async getByType(req, res) {
    try {
      const { typeId } = req.params;
      console.log(`[Suppliers] Obteniendo proveedores por tipo ID: ${typeId}`);
      console.log('[Suppliers] Usuario:', req.user._id, 'Rol:', req.user.role);

      const type = await SupplierType.findById(typeId);
      if (!type) {
        console.log('[Suppliers] Tipo no encontrado');
        return res.status(404).json({ error: 'Tipo de proveedor no encontrado' });
      }

      let query = { supplierType: typeId };
      
      // Solo activos para líder
      if (req.user.role === 'Líder') {
        query.status = 'active';
      }

      const suppliers = await Supplier.find(query)
        .select(req.user.role === 'Líder' ? 'name contact.phone' : '')
        .sort('name');

      console.log(`[Suppliers] Encontrados ${suppliers.length} proveedores de tipo ${type.subCategory}`);
      res.json({
        type: type.subCategory,
        suppliers
      });
    } catch (error) {
      console.error('[Suppliers] Error al obtener por tipo:', error.message);
      res.status(500).json({ error: 'Error al obtener proveedores por tipo' });
    }
  }
}

module.exports = SuppliersController;