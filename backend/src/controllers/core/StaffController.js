const Staff = require('../models/core/Staff');
const StaffType = require('../models/types/StaffType');

module.exports = {
    // Obtener todo el personal
    async getAllStaff(req, res) {
        try {
            console.log('[Staff] Obteniendo listado de personal');
            const staff = await Staff.find()
                .populate('tipoPersonal', 'nombre descripcion');

            console.log(`[Staff] Encontrados ${staff.length} registros`);
            res.status(200).json({ success: true, data: staff });
        } catch (error) {
            console.error('[Staff] Error al obtener personal:', error.message);
            res.status(500).json({ success: false, message: 'Error del servidor' });
        }
    },

    // Crear nuevo miembro del personal
    async createStaff(req, res) {
        try {
            console.log('[Staff] Creando nuevo registro:', req.body);
            const { identificacion, nombreCompleto, tipoPersonal, rol } = req.body;

            // Validaciones básicas
            if (!identificacion || !nombreCompleto || !tipoPersonal || !rol) {
                console.log('[Staff] Faltan campos obligatorios');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Identificación, nombre completo, tipo y rol son requeridos' 
                });
            }

            // Crear y guardar
            const newStaff = new Staff(req.body);
            await newStaff.save();

            console.log(`[Staff] Registro creado exitosamente: ${newStaff._id}`);
            res.status(201).json({ success: true, data: newStaff });
        } catch (error) {
            console.error('[Staff] Error al crear:', error.message);
            
            // Manejo de errores específicos
            if (error.code === 11000) {
                res.status(400).json({ 
                    success: false, 
                    message: 'La identificación ya está registrada' 
                });
            } else if (error.message.includes('no existe en la categoría')) {
                res.status(400).json({ 
                    success: false, 
                    message: error.message 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error del servidor' 
                });
            }
        }
    },

    // Obtener personal por ID
    async getStaffById(req, res) {
        try {
            const { id } = req.params;
            console.log(`[Staff] Buscando registro con ID: ${id}`);

            const staff = await Staff.findById(id)
                .populate('tipoPersonal', 'nombre descripcion roles');

            if (!staff) {
                console.log(`[Staff] Registro no encontrado: ${id}`);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            console.log(`[Staff] Registro encontrado: ${staff.nombreCompleto}`);
            res.status(200).json({ success: true, data: staff });
        } catch (error) {
            console.error('[Staff] Error al buscar por ID:', error.message);
            res.status(500).json({ 
                success: false, 
                message: 'Error del servidor' 
            });
        }
    },

    // Actualizar personal
    async updateStaff(req, res) {
        try {
            const { id } = req.params;
            console.log(`[Staff] Actualizando registro ${id}:`, req.body);

            // Verificar si se está cambiando el tipo o rol
            if (req.body.tipoPersonal || req.body.rol) {
                const tipo = await StaffType.findById(req.body.tipoPersonal || req.staff.tipoPersonal);
                if (!tipo) {
                    throw new Error('Tipo de personal no encontrado');
                }

                const rol = req.body.rol || req.staff.rol;
                const rolExiste = tipo.roles.some(r => r.nombre === rol);
                if (!rolExiste) {
                    throw new Error(`El rol "${rol}" no existe en la categoría "${tipo.nombre}"`);
                }
            }

            const updatedStaff = await Staff.findByIdAndUpdate(
                id, 
                req.body, 
                { new: true, runValidators: true }
            ).populate('tipoPersonal', 'nombre descripcion');

            if (!updatedStaff) {
                console.log(`[Staff] Registro no encontrado para actualizar: ${id}`);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            console.log(`[Staff] Actualizado correctamente: ${id}`);
            res.status(200).json({ success: true, data: updatedStaff });
        } catch (error) {
            console.error('[Staff] Error al actualizar:', error.message);
            
            if (error.message.includes('no existe en la categoría')) {
                res.status(400).json({ 
                    success: false, 
                    message: error.message 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error del servidor' 
                });
            }
        }
    },

    // Cambiar estado del personal (borrado lógico)
    async changeStaffStatus(req, res) {
        try {
            const { id } = req.params;
            const { activo, disponibilidad } = req.body;
            console.log(`[Staff] Cambiando estado del registro: ${id}`);

            const updateData = {};
            if (activo !== undefined) updateData['estado.activo'] = activo;
            if (disponibilidad !== undefined) updateData['estado.disponibilidad'] = disponibilidad;

            const updatedStaff = await Staff.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).populate('tipoPersonal', 'nombre');

            if (!updatedStaff) {
                console.log(`[Staff] Registro no encontrado: ${id}`);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            console.log(`[Staff] Estado actualizado: ${updatedStaff.estado.activo ? 'Activo' : 'Inactivo'}`);
            res.status(200).json({ 
                success: true, 
                message: 'Estado actualizado',
                data: {
                    activo: updatedStaff.estado.activo,
                    disponibilidad: updatedStaff.estado.disponibilidad
                }
            });
        } catch (error) {
            console.error('[Staff] Error al cambiar estado:', error.message);
            res.status(500).json({ 
                success: false, 
                message: 'Error del servidor' 
            });
        }
    },

    // Obtener personal por tipo
    async getStaffByType(req, res) {
        try {
            const { tipoId } = req.params;
            console.log(`[Staff] Buscando personal por tipo: ${tipoId}`);

            const staff = await Staff.find({ tipoPersonal: tipoId })
                .populate('tipoPersonal', 'nombre');

            console.log(`[Staff] Encontrados ${staff.length} registros para el tipo ${tipoId}`);
            res.status(200).json({ success: true, data: staff });
        } catch (error) {
            console.error('[Staff] Error al buscar por tipo:', error.message);
            res.status(500).json({ 
                success: false, 
                message: 'Error del servidor' 
            });
        }
    }
};