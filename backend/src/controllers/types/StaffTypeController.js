const StaffType = require('../../models/types/StaffType');

/**
 * Controlador para gestionar tipos de personal con control de permisos
 */
module.exports = {
    /**
     * Obtener todos los tipos de personal (Acceso: Líder+)
     */
    async getAllStaffTypes(req, res) {
        try {
            console.log('[StaffType] Obteniendo todos los tipos de personal');
            console.log(`[StaffType] Solicitado por: ${req.user.email} (${req.user.role})`);

            const staffTypes = await StaffType.find().sort({ nombre: 1 });
            
            console.log(`[StaffType] Encontrados ${staffTypes.length} registros`);
            res.status(200).json({
                success: true,
                count: staffTypes.length,
                data: staffTypes
            });
        } catch (error) {
            console.error('[StaffType] Error al obtener tipos:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tipos de personal'
            });
        }
    },

    /**
     * Crear nuevo tipo de personal (Acceso: Admin/Coordinador)
     */
    async createStaffType(req, res) {
        try {
            console.log('[StaffType] Creando nuevo tipo. Usuario:', req.user.email);
            const { nombre, descripcion, roles } = req.body;

            // Validación básica
            if (!nombre || !descripcion || !roles || !Array.isArray(roles)) {
                console.log('[StaffType] Validación fallida - Campos faltantes');
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, descripción y roles son requeridos'
                });
            }

            // Validar roles
            if (roles.length === 0) {
                console.log('[StaffType] Validación fallida - Sin roles');
                return res.status(400).json({
                    success: false,
                    message: 'Debe incluir al menos un rol'
                });
            }

            const newStaffType = new StaffType({
                nombre,
                descripcion,
                roles,
                creadoPor: req.user._id
            });

            await newStaffType.save();
            console.log(`[StaffType] Creado exitosamente ID: ${newStaffType._id}`);

            res.status(201).json({
                success: true,
                message: 'Tipo de personal creado',
                data: newStaffType
            });
        } catch (error) {
            console.error('[StaffType] Error al crear:', error.message);
            
            if (error.code === 11000) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre del tipo ya existe'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al crear tipo de personal'
                });
            }
        }
    },

    /**
     * Obtener tipo por ID (Acceso: Líder+)
     */
    async getStaffTypeById(req, res) {
        try {
            console.log(`[StaffType] Buscando tipo ID: ${req.params.id}`);
            const staffType = await StaffType.findById(req.params.id);

            if (!staffType) {
                console.log(`[StaffType] No encontrado ID: ${req.params.id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de personal no encontrado'
                });
            }

            console.log(`[StaffType] Encontrado: ${staffType.nombre}`);
            res.status(200).json({
                success: true,
                data: staffType
            });
        } catch (error) {
            console.error('[StaffType] Error al buscar por ID:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tipo de personal'
            });
        }
    },

    /**
     * Actualizar tipo de personal (Acceso: Admin/Coordinador)
     */
    async updateStaffType(req, res) {
        try {
            console.log(`[StaffType] Actualizando ID: ${req.params.id}`);
            console.log('Datos recibidos:', req.body);

            // Verificar existencia
            const existingType = await StaffType.findById(req.params.id);
            if (!existingType) {
                console.log(`[StaffType] No encontrado para actualizar: ${req.params.id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de personal no encontrado'
                });
            }

            // Validación especial para coordinadores
            if (req.user.role === 'coordinador') {
                console.log('[StaffType] Validando permisos de coordinador');
                if (req.body.roles && JSON.stringify(req.body.roles) !== JSON.stringify(existingType.roles)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Coordinadores no pueden modificar la estructura de roles'
                    });
                }
            }

            const updatedStaffType = await StaffType.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            console.log(`[StaffType] Actualizado ID: ${req.params.id}`);
            res.status(200).json({
                success: true,
                message: 'Tipo de personal actualizado',
                data: updatedStaffType
            });
        } catch (error) {
            console.error('[StaffType] Error al actualizar:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar tipo de personal'
            });
        }
    },

    /**
     * Eliminar tipo de personal (Acceso: Solo Admin)
     */
    async deleteStaffType(req, res) {
        try {
            console.log(`[StaffType] Eliminando ID: ${req.params.id}`);
            
            // Verificación redundante de permisos
            if (req.user.role !== 'admin') {
                console.log(`[StaffType] Intento de eliminación no autorizado por ${req.user.role}`);
                return res.status(403).json({
                    success: false,
                    message: 'Solo admines pueden eliminar tipos'
                });
            }

            const deletedStaffType = await StaffType.findByIdAndDelete(req.params.id);

            if (!deletedStaffType) {
                console.log(`[StaffType] No encontrado para eliminar: ${req.params.id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de personal no encontrado'
                });
            }

            console.log(`[StaffType] Eliminado ID: ${req.params.id}`);
            res.status(200).json({
                success: true,
                message: 'Tipo de personal eliminado',
                data: deletedStaffType
            });
        } catch (error) {
            console.error('[StaffType] Error al eliminar:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar tipo de personal'
            });
        }
    },

    /**
     * Agregar rol a tipo existente (Acceso: Admin/Coordinador)
     */
    async addRoleToStaffType(req, res) {
        try {
            console.log(`[StaffType] Agregando rol a ID: ${req.params.id}`);
            const { nombre, descripcion, requiereCertificacion } = req.body;

            // Validación básica
            if (!nombre) {
                console.log('[StaffType] Validación fallida - Nombre de rol faltante');
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del rol es requerido'
                });
            }

            const staffType = await StaffType.findById(req.params.id);
            if (!staffType) {
                console.log(`[StaffType] No encontrado ID: ${req.params.id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de personal no encontrado'
                });
            }

            // Verificar si el rol ya existe
            const roleExists = staffType.roles.some(r => r.nombre === nombre);
            if (roleExists) {
                console.log(`[StaffType] Rol ya existe: ${nombre}`);
                return res.status(400).json({
                    success: false,
                    message: 'El rol ya existe en este tipo'
                });
            }

            const newRole = {
                nombre,
                descripcion: descripcion || '',
                requiereCertificacion: requiereCertificacion || false
            };

            staffType.roles.push(newRole);
            await staffType.save();

            console.log(`[StaffType] Rol agregado a ID: ${req.params.id}`);
            res.status(200).json({
                success: true,
                message: 'Rol agregado exitosamente',
                data: staffType
            });
        } catch (error) {
            console.error('[StaffType] Error al agregar rol:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al agregar rol'
            });
        }
    }
};