const Personal = require('../models/core/Personal');
const StaffType = require('../models/types/StaffType');

/**
 * Controlador para gestionar el personal con control de roles
 */
module.exports = {
    // Obtener todo el personal (Líder+)
    async getAll(req, res) {
        try {
            console.log(`[Personal] GET all - Solicitado por: ${req.user.email} (${req.user.role})`);
            
            const personal = await Personal.find()
                .populate('tipoPersonal', 'nombre');
            
            res.status(200).json({ 
                success: true, 
                count: personal.length,
                data: personal 
            });
        } catch (error) {
            console.error('[Personal] Error al listar:', error.message);
            res.status(500).json({ 
                success: false, 
                message: 'Error al obtener personal' 
            });
        }
    },

    // Crear nuevo personal (Admin/Coordinador)
    async create(req, res) {
        try {
            console.log(`[Personal] CREATE - Usuario: ${req.user.email}`);
            const { identificacion, tipoPersonal } = req.body;

            // Validación básica
            if (!identificacion || !tipoPersonal) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Identificación y tipo son requeridos' 
                });
            }

            // Verificar tipo existente
            const tipoValido = await StaffType.findById(tipoPersonal);
            if (!tipoValido) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Tipo de personal no válido' 
                });
            }

            const nuevoPersonal = new Personal({
                ...req.body,
                creadoPor: req.user._id
            });

            await nuevoPersonal.save();
            
            res.status(201).json({ 
                success: true, 
                data: nuevoPersonal 
            });
        } catch (error) {
            console.error('[Personal] Error al crear:', error.message);
            
            if (error.code === 11000) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Identificación ya registrada' 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error al crear personal' 
                });
            }
        }
    },

    // Obtener personal por ID (Líder+)
    async getById(req, res) {
        try {
            console.log(`[Personal] GET by ID - ID: ${req.params.id}`);
            const personal = await Personal.findById(req.params.id)
                .populate('tipoPersonal', 'nombre roles');

            if (!personal) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            res.status(200).json({ 
                success: true, 
                data: personal 
            });
        } catch (error) {
            console.error('[Personal] Error al buscar:', error.message);
            res.status(500).json({ 
                success: false, 
                message: 'Error al obtener personal' 
            });
        }
    },

    // Actualizar personal (Admin/Coordinador)
    async update(req, res) {
        try {
            console.log(`[Personal] UPDATE - ID: ${req.params.id}`);
            
            // Coordinadores no pueden cambiar el tipo
            if (req.user.role === 'coordinador' && req.body.tipoPersonal) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No puedes modificar el tipo de personal' 
                });
            }

            const actualizado = await Personal.findByIdAndUpdate(
                req.params.id, 
                req.body, 
                { new: true, runValidators: true }
            );

            if (!actualizado) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            res.status(200).json({ 
                success: true, 
                data: actualizado 
            });
        } catch (error) {
            console.error('[Personal] Error al actualizar:', error.message);
            res.status(500).json({ 
                success: false, 
                message: 'Error al actualizar personal' 
            });
        }
    },

    // Cambiar estado (Admin)
    async changeStatus(req, res) {
        try {
            console.log(`[Personal] CHANGE STATUS - ID: ${req.params.id}`);
            
            // Solo admin puede desactivar
            if (req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Solo admines pueden cambiar estados' 
                });
            }

            const personal = await Personal.findByIdAndUpdate(
                req.params.id,
                { 'estado.activo': req.body.activo },
                { new: true }
            );

            if (!personal) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            res.status(200).json({ 
                success: true, 
                message: `Estado actualizado a ${personal.estado.activo ? 'activo' : 'inactivo'}` 
            });
        } catch (error) {
            console.error('[Personal] Error al cambiar estado:', error.message);
            res.status(500).json({ 
                success: false, 
                message: 'Error al cambiar estado' 
            });
        }
    }
};