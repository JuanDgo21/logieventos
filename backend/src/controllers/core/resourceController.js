const Recurso = require('../../models/core/Recurso');
const Evento = require('../../models/core/Evento'); // Asumiendo que existe un modelo Evento

// Obtener todos los recursos
exports.getAllRecursos = async (req, res) => {
    console.log('[RECURSO CONTROLLER] Ejecutando getAllRecursos');
    try {
        const { disponibilidadR, mantenimientoR } = req.query;
        let query = {};
        
        if (disponibilidadR) query.disponibilidadR = disponibilidadR;
        if (mantenimientoR) query.mantenimientoR = mantenimientoR;

        const recursos = await Recurso.find(query)
            .sort({ nombreRecursos: 1 });

        res.status(200).json({
            success: true,
            count: recursos.length,
            data: recursos
        });
    } catch (error) {
        console.error('[RECURSO CONTROLLER] Error en getAllRecursos:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los recursos'
        });
    }
};

// Obtener recursos disponibles
exports.getRecursosDisponibles = async (req, res) => {
    console.log('[RECURSO CONTROLLER] Ejecutando getRecursosDisponibles');
    try {
        const recursos = await Recurso.find({ disponibilidadR: 'Disponible' })
            .select('idRecursos nombreRecursos cantidadRecursos');

        res.status(200).json({
            success: true,
            count: recursos.length,
            data: recursos
        });
    } catch (error) {
        console.error('[RECURSO CONTROLLER] Error en getRecursosDisponibles:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recursos disponibles'
        });
    }
};

// Obtener recurso específico por ID
exports.getRecursoById = async (req, res) => {
    console.log('[RECURSO CONTROLLER] Ejecutando getRecursoById para ID:', req.params.id);
    try {
        const recurso = await Recurso.findById(req.params.id);

        if (!recurso) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: recurso
        });
    } catch (error) {
        console.error('[RECURSO CONTROLLER] Error en getRecursoById:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el recurso'
        });
    }
};

// Crear nuevo recurso
exports.createRecurso = async (req, res) => {
    console.log('[RECURSO CONTROLLER] Ejecutando createRecurso');
    try {
        const { idRecursos, nombreRecursos, cantidadRecursos, disponibilidadR, mantenimientoR } = req.body;

        // Validar campos requeridos
        if (!idRecursos || !nombreRecursos || !cantidadRecursos || !disponibilidadR || !mantenimientoR) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validar longitud máxima
        if (nombreRecursos.length > 45 || disponibilidadR.length > 45 || mantenimientoR.length > 45) {
            return res.status(400).json({
                success: false,
                message: 'Los campos de texto no pueden exceder los 45 caracteres'
            });
        }

        // Verificar si el ID de recurso ya existe
        const existeRecurso = await Recurso.findOne({ idRecursos });
        if (existeRecurso) {
            return res.status(400).json({
                success: false,
                message: 'El ID de recurso ya está en uso'
            });
        }

        const nuevoRecurso = new Recurso({
            idRecursos,
            nombreRecursos,
            cantidadRecursos,
            disponibilidadR,
            mantenimientoR
        });

        const recursoGuardado = await nuevoRecurso.save();
        
        res.status(201).json({
            success: true,
            message: 'Recurso creado exitosamente',
            data: recursoGuardado
        });
    } catch (error) {
        console.error('[RECURSO CONTROLLER] Error en createRecurso:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al crear el recurso',
            error: error.message
        });
    }
};

// Actualizar recurso
exports.updateRecurso = async (req, res) => {
    console.log('[RECURSO CONTROLLER] Ejecutando updateRecurso para ID:', req.params.id);
    try {
        const { nombreRecursos, cantidadRecursos, disponibilidadR, mantenimientoR } = req.body;

        // Validar longitud máxima si se actualizan estos campos
        if (nombreRecursos && nombreRecursos.length > 45) {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede exceder los 45 caracteres'
            });
        }

        if (disponibilidadR && disponibilidadR.length > 45) {
            return res.status(400).json({
                success: false,
                message: 'La disponibilidad no puede exceder los 45 caracteres'
            });
        }

        if (mantenimientoR && mantenimientoR.length > 45) {
            return res.status(400).json({
                success: false,
                message: 'El mantenimiento no puede exceder los 45 caracteres'
            });
        }

        const recursoActualizado = await Recurso.findByIdAndUpdate(
            req.params.id,
            {
                nombreRecursos,
                cantidadRecursos,
                disponibilidadR,
                mantenimientoR
            },
            { new: true, runValidators: true }
        );

        if (!recursoActualizado) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recurso actualizado exitosamente',
            data: recursoActualizado
        });
    } catch (error) {
        console.error('[RECURSO CONTROLLER] Error en updateRecurso:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el recurso'
        });
    }
};

// Eliminar recurso
exports.deleteRecurso = async (req, res) => {
    console.log('[RECURSO CONTROLLER] Ejecutando deleteRecurso para ID:', req.params.id);
    try {
        // Verificar si el recurso está asignado a algún evento
        const enEvento = await Evento.exists({ recursos: req.params.id });
        if (enEvento) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el recurso porque está asignado a un evento'
            });
        }

        const recursoEliminado = await Recurso.findByIdAndDelete(req.params.id);

        if (!recursoEliminado) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recurso eliminado exitosamente'
        });
    } catch (error) {
        console.error('[RECURSO CONTROLLER] Error en deleteRecurso:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el recurso'
        });
    }
};

// Cambiar estado de mantenimiento
exports.cambiarMantenimiento = async (req, res) => {
    console.log('[RECURSO CONTROLLER] Ejecutando cambiarMantenimiento');
    try {
        const { estadoMantenimiento } = req.body;
        
        if (!estadoMantenimiento || estadoMantenimiento.length > 45) {
            return res.status(400).json({
                success: false,
                message: 'Estado de mantenimiento no válido'
            });
        }

        const recurso = await Recurso.findByIdAndUpdate(
            req.params.id,
            { mantenimientoR: estadoMantenimiento },
            { new: true }
        );

        if (!recurso) {
            return res.status(404).json({
                success: false,
                message: 'Recurso no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Estado de mantenimiento actualizado',
            data: recurso
        });
    } catch (error) {
        console.error('[RECURSO CONTROLLER] Error en cambiarMantenimiento:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado de mantenimiento'
        });
    }
};