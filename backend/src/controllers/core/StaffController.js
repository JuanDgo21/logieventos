const Staff = require('../../models/core/Staff');
 
// Obtener todo el personal (Solo Admin)
exports.getAllStaff = async (req, res) => {
    console.log('[STAFF CONTROLLER] ejecutando getAllStaff'); // Diagnóstico
    try {
        const staff = await Staff.find();
        console.log('[STAFF CONTROLLER] Personal encontrado:', staff.length); // Diagnóstico
        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('[STAFF CONTROLLER] Error en getAllStaff:', error.message); // Diagnóstico
        res.status(500).json({
            success: false,
            message: 'Error al obtener el personal'
        });
    }
};

// Obtener miembro específico del personal
exports.getStaffById = async (req, res) => {
    console.log('[STAFF CONTROLLER] ejecutando getStaffById para ID:', req.params.id); // Diagnóstico
    try {
        const staffMember = await Staff.findById(req.params.id);

        if (!staffMember) {
            console.log('[STAFF CONTROLLER] Personal no encontrado'); // Diagnóstico
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        // Validaciones de acceso
        if (!req.user) {
            console.log('[STAFF CONTROLLER] Intento de acceso no autenticado'); // Diagnóstico
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        // Solo admin puede ver todo el personal, otros roles solo pueden ver su propia información
        if (req.user.role !== 'admin' && req.user.id !== staffMember.userId.toString()) {
            console.log('[STAFF CONTROLLER] Intento de acceso no autorizado'); // Diagnóstico
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a este miembro del personal'
            });
        }

        console.log('[STAFF CONTROLLER] Personal encontrado:', staffMember._id); // Diagnóstico
        res.status(200).json({
            success: true,
            data: staffMember
        });

    } catch (error) {
        console.error('[STAFF CONTROLLER] Error en getStaffById:', error.message); // Diagnóstico
        res.status(500).json({
            success: false,
            message: 'Error al obtener el miembro del personal',
            error: error.message
        });
    }
};

// Crear nuevo miembro del personal (Admin y coordinador)
exports.createStaff = async (req, res) => {
    console.log('[STAFF CONTROLLER] ejecutando createStaff'); // Diagnóstico
    try {
        const { name, position, department, contact, userId } = req.body;

        // Validar que el usuario asociado existe
        if (!userId) {
            console.log('[STAFF CONTROLLER] Falta userId en la solicitud'); // Diagnóstico
            return res.status(400).json({
                success: false,
                message: 'Se requiere un usuario asociado'
            });
        }

        const newStaff = new Staff({
            name,
            position,
            department,
            contact,
            userId
        });

        const savedStaff = await newStaff.save();
        console.log('[STAFF CONTROLLER] Personal creado:', savedStaff._id); // Diagnóstico

        res.status(201).json({
            success: true,
            message: 'Miembro del personal creado exitosamente',
            staff: savedStaff
        });
    } catch (error) {
        console.error('[STAFF CONTROLLER] Error en createStaff:', error.message); // Diagnóstico
        res.status(500).json({
            success: false,
            message: 'Error al crear el miembro del personal',
            error: error.message
        });
    }
};

// Actualizar miembro del personal (Admin y coordinador)
exports.updateStaff = async (req, res) => {
    console.log('[STAFF CONTROLLER] ejecutando updateStaff para ID:', req.params.id); // Diagnóstico
    try {
        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!updatedStaff) {
            console.log('[STAFF CONTROLLER] Personal no encontrado para actualizar'); // Diagnóstico
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        console.log('[STAFF CONTROLLER] Personal actualizado:', updatedStaff._id); // Diagnóstico
        res.status(200).json({
            success: true,
            message: 'Miembro del personal actualizado exitosamente',
            staff: updatedStaff
        });
    } catch (error) {
        console.error('[STAFF CONTROLLER] Error en updateStaff:', error.message); // Diagnóstico
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el miembro del personal',
            error: error.message
        });
    }
};

// Eliminar miembro del personal (Solo Admin)
exports.deleteStaff = async (req, res) => {
    console.log('[STAFF CONTROLLER] ejecutando deleteStaff para ID:', req.params.id); // Diagnóstico
    try {
        const deletedStaff = await Staff.findByIdAndDelete(req.params.id);

        if (!deletedStaff) {
            console.log('[STAFF CONTROLLER] Personal no encontrado para eliminar'); // Diagnóstico
            return res.status(404).json({
                success: false,
                message: 'Miembro del personal no encontrado'
            });
        }

        console.log('[STAFF CONTROLLER] Personal eliminado:', deletedStaff._id); // Diagnóstico
        res.status(200).json({
            success: true,
            message: 'Miembro del personal eliminado exitosamente'
        });
    } catch (error) {
        console.error('[STAFF CONTROLLER] Error en deleteStaff:', error.message); // Diagnóstico
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el miembro del personal'
        });
    }
};