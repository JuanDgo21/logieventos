const SupplierType = require('../../models/types/SupplierType');
const Supplier = require('../../models/core/Supplier');

// Obtener todos los tipos de proveedores
exports.getAllSupplierTypes = async (req, res) => {
    console.log('[SUPPLIERTYPE CONTROLLER] Ejecutando getAllSupplierTypes');
    try {
        const supplierTypes = await SupplierType.find().sort({ name: 1 });
        console.log(`[SUPPLIERTYPE CONTROLLER] ${supplierTypes.length} tipos de proveedores encontrados`);
        res.status(200).json({
            success: true,
            count: supplierTypes.length,
            data: supplierTypes
        });
    } catch (error) {
        console.error('[SUPPLIERTYPE CONTROLLER] Error en getAllSupplierTypes:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los tipos de proveedores'
        });
    }
};

// Obtener tipo de proveedor específico
exports.getSupplierTypeById = async (req, res) => {
    console.log('[SUPPLIERTYPE CONTROLLER] Ejecutando getSupplierTypeById para ID:', req.params.id);
    try {
        const supplierType = await SupplierType.findById(req.params.id);

        if (!supplierType) {
            console.log('[SUPPLIERTYPE CONTROLLER] Tipo de proveedor no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de proveedor no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: supplierType
        });
    } catch (error) {
        console.error('[SUPPLIERTYPE CONTROLLER] Error en getSupplierTypeById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el tipo de proveedor',
            error: error.message
        });
    }
};

// Crear nuevo tipo de proveedor (Solo Admin)
exports.createSupplierType = async (req, res) => {
    console.log('[SUPPLIERTYPE CONTROLLER] Ejecutando createSupplierType');
    try {
        const { name, description, category } = req.body;

        // Validar que no exista ya un tipo con el mismo nombre
        const existingType = await SupplierType.findOne({ name });
        if (existingType) {
            console.log('[SUPPLIERTYPE CONTROLLER] Tipo de proveedor ya existe');
            return res.status(400).json({
                success: false,
                message: 'Ya existe un tipo de proveedor con este nombre'
            });
        }

        const newSupplierType = new SupplierType({
            name,
            description,
            category: category || 'general'
        });

        const savedSupplierType = await newSupplierType.save();
        console.log('[SUPPLIERTYPE CONTROLLER] Tipo de proveedor creado:', savedSupplierType._id);

        res.status(201).json({
            success: true,
            message: 'Tipo de proveedor creado exitosamente',
            data: savedSupplierType
        });
    } catch (error) {
        console.error('[SUPPLIERTYPE CONTROLLER] Error en createSupplierType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al crear el tipo de proveedor',
            error: error.message
        });
    }
};

// Actualizar tipo de proveedor (Solo Admin)
exports.updateSupplierType = async (req, res) => {
    console.log('[SUPPLIERTYPE CONTROLLER] Ejecutando updateSupplierType para ID:', req.params.id);
    try {
        // Verificar que el tipo existe
        const existingType = await SupplierType.findById(req.params.id);
        if (!existingType) {
            console.log('[SUPPLIERTYPE CONTROLLER] Tipo de proveedor no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de proveedor no encontrado'
            });
        }

        // Validar que el nuevo nombre no colisione con otro tipo
        if (req.body.name && req.body.name !== existingType.name) {
            const nameExists = await SupplierType.findOne({ 
                name: req.body.name,
                _id: { $ne: req.params.id }
            });
            if (nameExists) {
                console.log('[SUPPLIERTYPE CONTROLLER] Nombre de tipo ya existe');
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro tipo de proveedor con este nombre'
                });
            }
        }

        const updatedSupplierType = await SupplierType.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        console.log('[SUPPLIERTYPE CONTROLLER] Tipo de proveedor actualizado:', updatedSupplierType._id);
        res.status(200).json({
            success: true,
            message: 'Tipo de proveedor actualizado exitosamente',
            data: updatedSupplierType
        });
    } catch (error) {
        console.error('[SUPPLIERTYPE CONTROLLER] Error en updateSupplierType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el tipo de proveedor',
            error: error.message
        });
    }
};

// Eliminar tipo de proveedor (Solo Admin, con validaciones)
exports.deleteSupplierType = async (req, res) => {
    console.log('[SUPPLIERTYPE CONTROLLER] Ejecutando deleteSupplierType para ID:', req.params.id);
    try {
        // Verificar que el tipo existe
        const supplierType = await SupplierType.findById(req.params.id);
        if (!supplierType) {
            console.log('[SUPPLIERTYPE CONTROLLER] Tipo de proveedor no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de proveedor no encontrado'
            });
        }

        // Verificar que no hay proveedores asignados a este tipo
        const suppliersWithThisType = await Supplier.findOne({ type: req.params.id });
        if (suppliersWithThisType) {
            console.log('[SUPPLIERTYPE CONTROLLER] Intento de eliminar tipo en uso');
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el tipo de proveedor porque está asignado a uno o más proveedores'
            });
        }

        const deletedSupplierType = await SupplierType.findByIdAndDelete(req.params.id);
        console.log('[SUPPLIERTYPE CONTROLLER] Tipo de proveedor eliminado:', deletedSupplierType._id);

        res.status(200).json({
            success: true,
            message: 'Tipo de proveedor eliminado exitosamente'
        });
    } catch (error) {
        console.error('[SUPPLIERTYPE CONTROLLER] Error en deleteSupplierType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el tipo de proveedor'
        });
    }
};

// Obtener proveedores por tipo
exports.getSuppliersByType = async (req, res) => {
    console.log('[SUPPLIERTYPE CONTROLLER] Ejecutando getSuppliersByType para tipo:', req.params.id);
    try {
        // Verificar que el tipo existe
        const supplierType = await SupplierType.findById(req.params.id);
        if (!supplierType) {
            console.log('[SUPPLIERTYPE CONTROLLER] Tipo de proveedor no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de proveedor no encontrado'
            });
        }

        const suppliers = await Supplier.find({ type: req.params.id })
            .populate('type', 'name -_id');

        res.status(200).json({
            success: true,
            data: {
                type: {
                    id: supplierType._id,
                    name: supplierType.name,
                    description: supplierType.description,
                    category: supplierType.category
                },
                suppliers: suppliers,
                count: suppliers.length
            }
        });
    } catch (error) {
        console.error('[SUPPLIERTYPE CONTROLLER] Error en getSuppliersByType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los proveedores por tipo'
        });
    }
};