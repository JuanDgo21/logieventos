const express = require('express');
const router = express.Router();
const StaffController = require('../../controllers/core/StaffController');
const { 
    authenticateJWT, 
    checkRole 
} = require('../../middlewares/auth');

console.log('Inicializando rutas de Staff...'); // Log de inicio

// ----------------------------------------
// Ruta GET: Obtener todo el personal
// Permisos: Admin, Coordinador, Líder
// Descripción: Lista todo el personal activo
// ----------------------------------------
router.get(
    '/',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador', 'Líder']),
    (req, res, next) => {
        console.log(`[STAFF] GET / - Solicitado por usuario ${req.user._id} (${req.user.role})`);
        console.log('Filtros aplicables:', {
            líder: 'Solo muestra su equipo',
            otros: 'Muestran todo el personal'
        });
        next();
    },
    StaffController.getAll
);

// ----------------------------------------
// Ruta POST: Crear nuevo personal
// Permisos: Admin, Coordinador
// Validaciones: Campos requeridos y únicos
// ----------------------------------------
router.post(
    '/',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador']),
    (req, res, next) => {
        console.log(`[STAFF] POST / - Creación solicitada por ${req.user._id}`);
        console.log('Datos recibidos:', {
            userId: req.body.userId,
            staffTypeId: req.body.staffTypeId,
            leaderId: req.body.leaderId
        });
        next();
    },
    StaffController.create
);

// ----------------------------------------
// Ruta POST: Asignar personal a evento
// Permisos: Admin, Coordinador
// Validaciones: Disponibilidad del staff
// ----------------------------------------
router.post(
    '/:id/assign',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador']),
    (req, res, next) => {
        console.log(`[STAFF] POST /${req.params.id}/assign - Asignación a evento`);
        console.log('Detalles asignación:', {
            staffId: req.params.id,
            eventId: req.body.eventId,
            role: req.body.role
        });
        next();
    },
    StaffController.assignToEvent
);

// ----------------------------------------
// Ruta PUT: Actualizar personal
// Permisos: Admin (completo), Coordinador (limitado)
// Restricciones: Coordinadores no pueden cambiar tipo
// ----------------------------------------
router.put(
    '/:id',
    authenticateJWT,
    checkRole(['Admin', 'Coordinador']),
    (req, res, next) => {
        console.log(`[STAFF] PUT /${req.params.id} - Actualización solicitada por ${req.user._id}`);
        console.log('Campos a actualizar:', Object.keys(req.body));
        if (req.user.role === 'Coordinador' && req.body.staffTypeId) {
            console.warn('Intento de Coordinador de modificar staffTypeId');
        }
        next();
    },
    StaffController.update
);

// ----------------------------------------
// Ruta PATCH: Desactivar personal
// Permisos: Solo Admin
// Efecto: Cambia isActive a false
// ----------------------------------------
router.patch(
    '/:id/deactivate',
    authenticateJWT,
    checkRole(['Admin']),
    (req, res, next) => {
        console.log(`[STAFF] PATCH /${req.params.id}/deactivate - Desactivación solicitada`);
        console.log('Usuario administrador:', req.user.email);
        next();
    },
    StaffController.deactivate
);

console.log('Rutas de Staff configuradas correctamente'); // Log de finalización
module.exports = router;