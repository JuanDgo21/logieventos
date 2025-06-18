const StaffType = require('../../models/types/StaffType');
const { validationResult } = require('express-validator');

/**
 * Controlador para gestionar operaciones CRUD de tipos de personal
 * (Adaptado para el esquema Mongoose actual)
 */
const StaffTypeController = {
    /**
     * Obtener todos los tipos de personal
     */
    getAll: async (req, res) => {
        try {
            console.log('[StaffTypeController] Obteniendo todos los tipos de personal');
            const staffTypes = await StaffType.find({})
                .sort({ nombre: 1 });
            
            console.log(`[StaffTypeController] Encontrados ${staffTypes.length} tipos de personal`);
            res.status(200).json({
                success: true,
                data: staffTypes
            });
        } catch (error) {
            console.error('[StaffTypeController] Error al obtener tipos de personal:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    /**
     * Crear un nuevo tipo de personal
     */
    create: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn('[StaffTypeController] Validación fallida al crear tipo de personal:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            console.log('[StaffTypeController] Intentando crear nuevo tipo de personal:', req.body.nombre);
            
            const { nombre, descripcion, roles, icono } = req.body;
            
            const newStaffType = new StaffType({
                nombre,
                descripcion,
                roles,
                icono: icono || '👔'
            });

            await newStaffType.save();

            console.log(`[StaffTypeController] Tipo de personal creado exitosamente - ID: ${newStaffType._id}`);
            res.status(201).json({
                success: true,
                data: newStaffType
            });
        } catch (error) {
            console.error('[StaffTypeController] Error al crear tipo de personal:', error.message);
            
            let errorMessage = 'Error al crear tipo de personal';
            if (error.message.includes('duplicados')) {
                errorMessage = error.message;
            }
            
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    },

    /**
     * Obtener un tipo de personal por ID
     */
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`[StaffTypeController] Buscando tipo de personal ID: ${id}`);
            
            const staffType = await StaffType.findById(id);
            if (!staffType) {
                console.warn(`[StaffTypeController] Tipo de personal no encontrado - ID: ${id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de personal no encontrado'
                });
            }

            console.log(`[StaffTypeController] Tipo de personal encontrado - ID: ${id}`);
            res.status(200).json({
                success: true,
                data: staffType
            });
        } catch (error) {
            console.error(`[StaffTypeController] Error al buscar tipo de personal ID: ${req.params.id}:`, error.message);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tipo de personal'
            });
        }
    },

    /**
     * Actualizar un tipo de personal existente
     */
    update: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn('[StaffTypeController] Validación fallida al actualizar tipo de personal:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { id } = req.params;
            console.log(`[StaffTypeController] Intentando actualizar tipo de personal ID: ${id}`);
            
            const { nombre, descripcion, roles, icono } = req.body;
            
            const updatedStaffType = await StaffType.findByIdAndUpdate(
                id,
                {
                    nombre,
                    descripcion,
                    roles,
                    icono
                },
                { new: true, runValidators: true }
            );

            if (!updatedStaffType) {
                console.warn(`[StaffTypeController] Tipo de personal no encontrado - ID: ${id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de personal no encontrado'
                });
            }

            console.log(`[StaffTypeController] Tipo de personal actualizado exitosamente - ID: ${id}`);
            res.status(200).json({
                success: true,
                data: updatedStaffType
            });
        } catch (error) {
            console.error(`[StaffTypeController] Error al actualizar tipo de personal ID: ${req.params.id}:`, error.message);
            
            let errorMessage = 'Error al actualizar tipo de personal';
            if (error.message.includes('duplicados')) {
                errorMessage = error.message;
            }
            
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    },

    /**
     * Agregar un nuevo rol a un tipo de personal existente
     */
    agregarRol: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, descripcion, requiereCertificacion } = req.body;
            
            console.log(`[StaffTypeController] Agregando rol a tipo de personal ID: ${id}`);
            
            const staffType = await StaffType.findById(id);
            if (!staffType) {
                console.warn(`[StaffTypeController] Tipo de personal no encontrado - ID: ${id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de personal no encontrado'
                });
            }

            const nuevoRol = {
                nombre,
                descripcion,
                requiereCertificacion: requiereCertificacion || false
            };

            // Usamos el método personalizado del modelo
            await staffType.agregarRol(nuevoRol);

            console.log(`[StaffTypeController] Rol agregado exitosamente a tipo ID: ${id}`);
            res.status(200).json({
                success: true,
                data: staffType
            });
        } catch (error) {
            console.error(`[StaffTypeController] Error al agregar rol a tipo ID: ${req.params.id}:`, error.message);
            
            let errorMessage = 'Error al agregar rol';
            if (error.message.includes('duplicados')) {
                errorMessage = 'Ya existe un rol con ese nombre en este tipo de personal';
            }
            
            res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    },

    /**
     * Eliminar (desactivar) un tipo de personal
     * Nota: En tu esquema actual no hay campo isActive, podrías considerar añadirlo
     */
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`[StaffTypeController] Eliminando tipo de personal ID: ${id}`);
            
            const deletedStaffType = await StaffType.findByIdAndDelete(id);
            
            if (!deletedStaffType) {
                console.warn(`[StaffTypeController] Tipo de personal no encontrado - ID: ${id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de personal no encontrado'
                });
            }

            console.log(`[StaffTypeController] Tipo de personal eliminado exitosamente - ID: ${id}`);
            res.status(200).json({
                success: true,
                message: 'Tipo de personal eliminado correctamente'
            });
        } catch (error) {
            console.error(`[StaffTypeController] Error al eliminar tipo de personal ID: ${req.params.id}:`, error.message);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar tipo de personal'
            });
        }
    }
};

module.exports = StaffTypeController;