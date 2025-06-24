const express = require('express');
const router = express.Router();
const staffController = require('../../controllers/core/StaffController');
const { verifyToken } = require('../../middlewares/authJwt');
const { isAdmin, isCoordinador, isLider, fullAccess, readWriteAccess, readOnlyAccess } = require('../../middlewares/role');
const { check } = require('express-validator');
const mongoose = require('mongoose');

// Validaciones para creación y actualización de Staff
const validateStaff = [
    check('userId')
        .not().isEmpty().withMessage('El ID de usuario es obligatorio')
        .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('ID de usuario no válido'),
    check('staffTypeId')
        .not().isEmpty().withMessage('El tipo de personal es obligatorio')
        .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('ID de tipo de personal no válido'),
    check('identification')
        .not().isEmpty().withMessage('La identificación es obligatoria')
        .trim()
        .isLength({ min: 5, max: 20 }).withMessage('La identificación debe tener entre 5 y 20 caracteres'),
    check('name')
        .not().isEmpty().withMessage('El nombre es obligatorio')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    check('phone')
        .not().isEmpty().withMessage('El teléfono es obligatorio')
        .trim()
        .isLength({ min: 7, max: 15 }).withMessage('El teléfono debe tener entre 7 y 15 caracteres'),
    check('role')
        .not().isEmpty().withMessage('El rol es obligatorio')
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('El rol debe tener entre 3 y 50 caracteres'),
    check('emergencyContact')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('El contacto de emergencia no puede exceder 100 caracteres')
];

// Middleware para verificar ID válido
const validateObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.warn('ID inválido proporcionado en ruta:', req.params.id);
        return res.status(400).json({
            success: false,
            message: 'ID de personal inválido'
        });
    }
    next();
};

// ----------------------------
// 2.1 Registro de nuevo personal (Admin y Coordinador)
// ----------------------------
router.post(
    '/',
    [
        verifyToken,
        readWriteAccess, // Admin y coordinador
        ...validateStaff
    ],
    staffController.createStaff
);

// ----------------------------
// 2.2 Consulta de personal
// ----------------------------

// 2.2.1 Obtener todo el personal (Admin: completo, Coordinador: solo activos, Líder: con restricciones)
router.get(
    '/',
    [
        verifyToken,
        (req, res, next) => {
            // Middleware condicional para filtrar según rol
            if (req.user.role === 'coordinador') {
                req.query.activeOnly = true;
            } else if (req.user.role === 'lider') {
                // Para líderes, se manejará en el controlador
                req.query.liderAccess = true;
            }
            next();
        }
    ],
    staffController.getAllStaff
);

// 2.2.2 Obtener un miembro específico (Todos los roles con diferentes permisos)
router.get(
    '/:id',
    [
        verifyToken,
        validateObjectId,
        (req, res, next) => {
            // Middleware condicional para verificar acceso
            if (req.user.role === 'lider') {
                req.query.liderAccess = true;
            }
            next();
        }
    ],
    staffController.getStaffById
);

// ----------------------------
// 2.3 Edición de personal (Admin y Coordinador)
// ----------------------------
router.put(
    '/:id',
    [
        verifyToken,
        readWriteAccess, // Admin y coordinador
        validateObjectId,
        ...validateStaff.slice(1)
    ],
    staffController.updateStaff
);

// ----------------------------
// 2.4 Control de asistencia (Admin y Coordinador)
// ----------------------------
router.patch(
    '/:id/attendance',
    [
        verifyToken,
        readWriteAccess, // Admin y coordinador
        validateObjectId,
        check('asistencia')
            .not().isEmpty().withMessage('El estado de asistencia es obligatorio')
            .isBoolean().withMessage('El estado de asistencia debe ser verdadero o falso')
    ],
    staffController.updateAttendance
);

// ----------------------------
// 2.5 Eliminación de personal (Solo Admin)
// ----------------------------
router.delete(
    '/:id',
    [
        verifyToken,
        fullAccess, // Solo admin
        validateObjectId
    ],
    staffController.deleteStaff
);

// ----------------------------
// Métodos adicionales útiles
// ----------------------------

// Obtener personal por tipo (Admin y Coordinador)
router.get(
    '/type/:id',
    [
        verifyToken,
        readWriteAccess, // Admin y coordinador
        validateObjectId
    ],
    staffController.getStaffByType
);

// Buscar personal por identificación o nombre (Todos los roles con restricciones)
router.get(
    '/search/term',
    [
        verifyToken,
        (req, res, next) => {
            // Middleware condicional para verificar acceso
            if (req.user.role === 'lider') {
                req.query.liderAccess = true;
            }
            next();
        },
        check('term')
            .not().isEmpty().withMessage('El término de búsqueda es obligatorio')
            .isLength({ min: 3 }).withMessage('El término debe tener al menos 3 caracteres')
    ],
    staffController.searchStaff
);

module.exports = router;