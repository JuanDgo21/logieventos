const Supplier = require('../../models/core/Supplier');
const SupplierType = require('../../models/core/SupplierType');

// Obtener todos los proveedores
exports.getAllSuppliers = async (req, res) => {
    console.log('[SUPPLIER CONTROLLER] ejecutando getAllSuppliers');
    try {
        const suppliers = await Supplier.find().populate('type', 'name -_id');
        console.log('[SUPPLIER CONTROLLER] Proveedores encontrados:', suppliers.length);
        res.status(200).json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        console.error('[SUPPLIER CONTROLLER] Error en getAllSuppliers:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los proveedores'
        });
    }
};

// Obtener proveedor específico
exports.getSupplierById = async (req, res) => {
    console.log('[SUPPLIER CONTROLLER] ejecutando getSupplierById para ID:', req.params.id);
    try {
        const supplier = await Supplier.findById(req.params.id).populate('type', 'name description -_id');

        if (!supplier) {
            console.log('[SUPPLIER CONTROLLER] Proveedor no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: supplier
        });

    } catch (error) {
        console.error('[SUPPLIER CONTROLLER] Error en getSupplierById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el proveedor',
            error: error.message
        });
    }
};

// Crear nuevo proveedor (Admin y coordinador)
exports.createSupplier = async (req, res) => {
    console.log('[SUPPLIER CONTROLLER] ejecutando createSupplier');
    try {
        const { name, contact, address, type, notes } = req.body;

        // Validar que el tipo de proveedor existe
        const supplierType = await SupplierType.findById(type);
        if (!supplierType) {
            console.log('[SUPPLIER CONTROLLER] Tipo de proveedor no válido');
            return res.status(400).json({
                success: false,
                message: 'Tipo de proveedor no válido'
            });
        }

        const newSupplier = new Supplier({
            name,
            contact,
            address,
            type,
            notes
        });

        const savedSupplier = await newSupplier.save();
        console.log('[SUPPLIER CONTROLLER] Proveedor creado:', savedSupplier._id);

        // Populate el tipo para la respuesta
        const populatedSupplier = await Supplier.findById(savedSupplier._id).populate('type', 'name -_id');

        res.status(201).json({
            success: true,
            message: 'Proveedor creado exitosamente',
            supplier: populatedSupplier
        });
    } catch (error) {
        console.error('[SUPPLIER CONTROLLER] Error en createSupplier:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al crear el proveedor',
            error: error.message
        });
    }
};

// Actualizar proveedor (Admin y coordinador)
exports.updateSupplier = async (req, res) => {
    console.log('[SUPPLIER CONTROLLER] ejecutando updateSupplier para ID:', req.params.id);
    try {
        // Si se actualiza el tipo, validar que existe
        if (req.body.type) {
            const supplierType = await SupplierType.findById(req.body.type);
            if (!supplierType) {
                console.log('[SUPPLIER CONTROLLER] Tipo de proveedor no válido');
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de proveedor no válido'
                });
            }
        }

        const updatedSupplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('type', 'name -_id');

        if (!updatedSupplier) {
            console.log('[SUPPLIER CONTROLLER] Proveedor no encontrado para actualizar');
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        console.log('[SUPPLIER CONTROLLER] Proveedor actualizado:', updatedSupplier._id);
        res.status(200).json({
            success: true,
            message: 'Proveedor actualizado exitosamente',
            supplier: updatedSupplier
        });
    } catch (error) {
        console.error('[SUPPLIER CONTROLLER] Error en updateSupplier:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el proveedor',
            error: error.message
        });
    }
};

// Eliminar proveedor (Solo Admin)
exports.deleteSupplier = async (req, res) => {
    console.log('[SUPPLIER CONTROLLER] ejecutando deleteSupplier para ID:', req.params.id);
    try {
        const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);

        if (!deletedSupplier) {
            console.log('[SUPPLIER CONTROLLER] Proveedor no encontrado para eliminar');
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        console.log('[SUPPLIER CONTROLLER] Proveedor eliminado:', deletedSupplier._id);
        res.status(200).json({
            success: true,
            message: 'Proveedor eliminado exitosamente'
        });
    } catch (error) {
        console.error('[SUPPLIER CONTROLLER] Error en deleteSupplier:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el proveedor'
        });
    }
};

// Obtener proveedores por tipo
exports.getSuppliersByType = async (req, res) => {
    console.log('[SUPPLIER CONTROLLER] ejecutando getSuppliersByType para tipo:', req.params.typeId);
    try {
        // Validar que el tipo existe
        const supplierType = await SupplierType.findById(req.params.typeId);
        if (!supplierType) {
            console.log('[SUPPLIER CONTROLLER] Tipo de proveedor no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Tipo de proveedor no encontrado'
            });
        }

        const suppliers = await Supplier.find({ type: req.params.typeId }).populate('type', 'name -_id');
        
        res.status(200).json({
            success: true,
            data: suppliers,
            type: {
                id: supplierType._id,
                name: supplierType.name
            }
        });
    } catch (error) {
        console.error('[SUPPLIER CONTROLLER] Error en getSuppliersByType:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedores por tipo'
        });
    }
};