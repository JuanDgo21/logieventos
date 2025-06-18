const Staff = require('../../models/core/Staff');
const StaffType = require('../../models/types/StaffType');
const Event = require('../../models/main/Event');

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

            // Filtro base: solo personal activo
            let query = { isActive: true };

            // Filtro adicional para Líder: solo su equipo
            if (role === 'Líder') {
                console.log('Aplicando filtro para Líder...');
                query.leaderId = _id;
            }

            console.log('Consultando base de datos...');
            const staff = await Staff.find(query)
                .populate('staffTypeId', 'name requiredCertifications')
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

            // Restricción para Coordinadores: no pueden asignar líderes
            if (role === 'Coordinador' && req.body.leaderId) {
                console.warn('Coordinador intentó asignar líder - Campo removido');
                delete req.body.leaderId;
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
    // Asignar a evento (Coordinador)
    // ----------------------------------------
    async assignToEvent(req, res) {
        console.log(`Ejecutando assignToEvent - Asignando personal ID: ${req.params.id}`);
        try {
            const { eventId, role } = req.body;
            console.log(`Datos de asignación - eventId: ${eventId}, role: ${role}`);

            const staff = await Staff.findById(req.params.id);
            if (!staff) {
                console.warn('Personal no encontrado para asignación');
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            // Verificar disponibilidad del personal
            console.log('Verificando disponibilidad...');
            const isAvailable = await staff.checkAvailability(eventId);
            if (!isAvailable) {
                console.warn('El personal no está disponible para el evento');
                return res.status(400).json({ 
                    success: false, 
                    message: 'El personal no está disponible en esas fechas' 
                });
            }

            console.log('Realizando asignación...');
            staff.assignedEvents.push({ eventId, role });
            await staff.save();

            // Actualizar el evento con el nuevo personal asignado
            await Event.findByIdAndUpdate(eventId, {
                $push: { assignedStaff: { staffId: staff._id, role } }
            });
            console.log('Asignación completada exitosamente');

            res.json({ 
                success: true, 
                message: 'Asignación exitosa' 
            });

        } catch (error) {
            console.error('[Staff] Error en assignToEvent:', error.message);
            console.error(error.stack);
            res.status(500).json({ 
                success: false, 
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
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

            // Restricción para Coordinadores: no pueden cambiar el tipo de personal
            if (role === 'Coordinador' && updates.staffTypeId) {
                console.warn('Coordinador intentó modificar tipo de personal');
                return res.status(403).json({ 
                    success: false, 
                    message: 'No puedes modificar el tipo de personal' 
                });
            }

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
    // Desactivar personal (Admin)
    // ----------------------------------------
    async deactivate(req, res) {
        console.log(`Ejecutando deactivate - Desactivando personal ID: ${req.params.id}`);
        try {
            console.log('Buscando personal...');
            const staff = await Staff.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            );

            if (!staff) {
                console.warn('Personal no encontrado para desactivación');
                return res.status(404).json({ 
                    success: false, 
                    message: 'Personal no encontrado' 
                });
            }

            console.log(`Personal desactivado ID: ${staff._id}`);
            res.json({ 
                success: true, 
                message: 'Personal desactivado' 
            });

        } catch (error) {
            console.error('[Staff] Error en deactivate:', error.message);
            console.error(error.stack);
            res.status(500).json({ 
                success: false, 
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};