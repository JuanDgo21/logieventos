const Staff = require('../../models/core/Staff');
const StaffType = require('../../models/types/StaffType');

console.log('Controlador de Staff inicializado');

module.exports = {
    // ----------------------------------------
    // Obtener todo el personal (Admin/Coordinador)
    // Líder: Solo ve su equipo
    // ----------------------------------------
    async getAll(req, res) {
        console.log('Ejecutando getAll - Listado de personal');
        try {
            const { role, _id } = req.user;
            console.log(`Solicitud recibida de usuario con rol: ${role}`);

            // Filtro base
            let query = {};

            // Filtro adicional para Líder: solo su equipo
            if (role === 'Líder') {
                console.log('Aplicando filtro para Líder...');
                query.leaderId = _id;
            }

            console.log('Consultando base de datos...');
            const staff = await Staff.find(query)
                .populate('staffTypeId', 'name')
                .populate('userId', 'email role');

            console.log(`Personal encontrado: ${staff.length} registros`);
            res.json({ 
                success: true, 
                data: staff 
            });

        } catch (error) {
            console.error('[Staff] Error en getAll:', error.message);
            console.error(error.stack);
            res.status(500).json({ 
                success: false, 
                message: 'Error al obtener personal',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ----------------------------------------
    // Crear personal (Admin/Coordinador)
    // ----------------------------------------
    async create(req, res) {
        console.log('Ejecutando create - Crear nuevo registro de personal');
        try {
            const { role } = req.user;
            const { userId, staffTypeId } = req.body;
            console.log(`Datos recibidos - userId: ${userId}, staffTypeId: ${staffTypeId}`);

            // Validación básica de campos requeridos
            if (!userId || !staffTypeId) {
                console.warn('Faltan campos requeridos para crear personal');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Usuario y tipo de personal son requeridos' 
                });
            }

            console.log('Creando nuevo registro...');
            const newStaff = await Staff.create(req.body);
            console.log(`Nuevo personal creado con ID: ${newStaff._id}`);

            res.status(201).json({ 
                success: true, 
                data: newStaff 
            });

        } catch (error) {
            console.error('[Staff] Error en create:', error.message);
            
            if (error.code === 11000) {
                console.warn('Intento de crear personal duplicado');
                res.status(400).json({ 
                    success: false, 
                    message: 'El usuario ya está registrado como personal' 
                });
            } else {
                console.error('Error interno:', error.stack);
                res.status(500).json({ 
                    success: false, 
                    message: error.message,
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    },

    // ----------------------------------------
    // Actualizar personal (Admin/Coordinador)
    // ----------------------------------------
    async update(req, res) {
        console.log(`Ejecutando update - Actualizando personal ID: ${req.params.id}`);
        try {
            const { role } = req.user;
            const updates = req.body;
            console.log(`Actualizaciones solicitadas:`, updates);

            console.log('Realizando actualización...');
            const updatedStaff = await Staff.findByIdAndUpdate(
                req.params.id, 
                updates, 
                { new: true, runValidators: true }
            );

            if (!updatedStaff) {
                console.warn('Personal no encontrado para actualización');
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            console.log(`Personal actualizado ID: ${updatedStaff._id}`);
            res.json({ 
                success: true, 
                data: updatedStaff 
            });

        } catch (error) {
            console.error('[Staff] Error en update:', error.message);
            console.error(error.stack);
            res.status(500).json({ 
                success: false, 
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ----------------------------------------
    // Registrar asistencia (Admin/Coordinador)
    // ----------------------------------------
    async updateAsistencia(req, res) {
        console.log(`Ejecutando updateAsistencia - Actualizando asistencia ID: ${req.params.id}`);
        try {
            const { asistencia } = req.body;
            console.log(`Nuevo estado de asistencia: ${asistencia}`);

            const updatedStaff = await Staff.findByIdAndUpdate(
                req.params.id, 
                { asistencia }, 
                { new: true }
            );

            if (!updatedStaff) {
                console.warn('Personal no encontrado');
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            console.log(`Asistencia actualizada para ID: ${updatedStaff._id}`);
            res.json({ 
                success: true, 
                message: 'Asistencia actualizada',
                data: updatedStaff
            });

        } catch (error) {
            console.error('[Staff] Error en updateAsistencia:', error.message);
            console.error(error.stack);
            res.status(500).json({ 
                success: false, 
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};