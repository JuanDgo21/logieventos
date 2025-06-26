const express = require('express');
const router = express.Router();
const staffController = require('../../controllers/core/StaffController');
const { verifyToken } = require('../../middlewares/authJwt');
const { isAdmin, isCoordinador, isLider, fullAccess, readWriteAccess, readOnlyAccess } = require('../../middlewares/role');
const { check } = require('express-validator');
const mongoose = require('mongoose');

console.log('Inicializando rutas de Staff...');

// Middleware para logging de solicitudes
const requestLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Usuario:', req.user?.id, 'Rol:', req.user?.role);
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    next();
};

// Validaciones para creación y actualización de Staff
const validateStaff = [
    check('userId')
        .not().isEmpty().withMessage('El ID de usuario es obligatorio')
        .custom(value => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                console.error('ID de usuario no válido:', value);
                throw new Error('ID de usuario no válido');
            }
            return true;
        })
        .custom(async (value, { req }) => {
            // Verificar que el usuario exista
            const user = await mongoose.model('User').findById(value);
            if (!user) {
                console.error('Usuario no encontrado con ID:', value);
                throw new Error('El usuario especificado no existe');
            }
            return true;
        }),
    
    check('staffTypeId')
        .not().isEmpty().withMessage('El tipo de personal es obligatorio')
        .custom(value => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                console.error('ID de tipo de personal no válido:', value);
                throw new Error('ID de tipo de personal no válido');
            }
            return true;
        })
        .custom(async (value, { req }) => {
            // Verificar que el tipo de personal exista y esté activo
            const staffType = await mongoose.model('StaffType').findById(value);
            if (!staffType) {
                console.error('Tipo de personal no encontrado con ID:', value);
                throw new Error('El tipo de personal especificado no existe');
            }
            if (!staffType.isActive) {
                console.error('Tipo de personal inactivo con ID:', value);
                throw new Error('No se puede asignar un tipo de personal inactivo');
            }
            return true;
        }),
    
    check('identification')
        .not().isEmpty().withMessage('La identificación es obligatoria')
        .trim()
        .isLength({ min: 5, max: 20 }).withMessage('La identificación debe tener entre 5 y 20 caracteres')
        .matches(/^[A-Za-z0-9-]+$/).withMessage('La identificación solo puede contener letras, números y guiones')
        .custom(async (value, { req }) => {
            // Verificar unicidad de la identificación
            const existingStaff = await mongoose.model('Staff').findOne({ identification: value });
            if (existingStaff && (!req.params.id || existingStaff._id.toString() !== req.params.id)) {
                console.error('Identificación ya existe:', value);
                throw new Error('La identificación ya está en uso');
            }
            return true;
        }),
    
    check('name')
        .not().isEmpty().withMessage('El nombre es obligatorio')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios')
        .custom(value => {
            // Validar que sea nombre completo (al menos 2 palabras)
            const parts = value.trim().split(/\s+/);
            if (parts.length < 2) {
                console.error('Nombre incompleto:', value);
                throw new Error('Debe proporcionar al menos nombre y apellido');
            }
            return true;
        }),
    
    check('phone')
        .not().isEmpty().withMessage('El teléfono es obligatorio')
        .trim()
        .isLength({ min: 7, max: 15 }).withMessage('El teléfono debe tener entre 7 y 15 caracteres')
        .matches(/^\+?\d+$/).withMessage('El teléfono solo puede contener números y opcionalmente un + al inicio'),
    
    check('role')
        .not().isEmpty().withMessage('El rol es obligatorio')
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('El rol debe tener entre 3 y 50 caracteres')
        .isIn(['admin', 'coordinador', 'lider', 'tecnico', 'seguridad', 'logistica']).withMessage('Rol no válido'),
    
    check('emergencyContact')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El contacto de emergencia no puede exceder 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}(?:\s*-\s*\+?\d{7,15})?$/)
    .withMessage('Formato inválido. Use: "Nombre - +123456789" o solo nombre'),
];

// Middleware para verificar ID válido con logging
const validateObjectId = (req, res, next) => {
    const id = req.params.id;
    console.log(`Validando ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error('ID inválido proporcionado:', id);
        return res.status(400).json({
            success: false,
            message: 'ID de personal inválido',
            receivedId: id
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
        requestLogger,
        verifyToken,
        readWriteAccess, // Admin y coordinador
        ...validateStaff
    ],
    staffController.createStaff
);

// ----------------------------
// 2.2 Consulta de personal 
// ----------------------------

// Middleware para filtrar según rol
const filterByRole = (req, res, next) => {
    console.log(`Filtrando para rol: ${req.user.role}`);
    
    switch (req.user.role) {
        case 'coordinador':
            req.query.activeOnly = true;
            break;
        case 'lider':
            req.query.liderAccess = true;
            req.query.activeOnly = true;
            break;
        default:
            // Admin tiene acceso completo
            break;
    }
    
    next();
};

// 2.2.1 Obtener todo el personal
router.get(
    '/',
    [
        requestLogger,
        verifyToken,
        filterByRole,
        check('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
        check('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe ser entre 1 y 100')
    ],
    staffController.getAllStaff
);

// 2.2.2 Obtener un miembro específico
router.get(
    '/:id',
    [
        requestLogger,
        verifyToken,
        validateObjectId,
        (req, res, next) => {
            // Verificar acceso para líderes
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
        requestLogger,
        verifyToken,
        readWriteAccess, // Admin y coordinador
        validateObjectId,
        ...validateStaff.filter(v => v.field !== 'userId') // No validar userId en actualización
    ],
    staffController.updateStaff
);

// ----------------------------
// 2.4 Control de asistencia (Admin y Coordinador)
// ----------------------------
router.patch(
    '/:id/attendance',
    [
        requestLogger,
        verifyToken,
        readWriteAccess, // Admin y coordinador
        validateObjectId,
        check('asistencia')
            .not().isEmpty().withMessage('El estado de asistencia es obligatorio')
            .isBoolean().withMessage('El estado de asistencia debe ser verdadero o falso')
            .toBoolean()
    ],
    staffController.updateAttendance
);

// ----------------------------
// 2.5 Eliminación de personal (Solo Admin)
// ----------------------------
router.delete(
    '/:id',
    [
        requestLogger,
        verifyToken,
        fullAccess, // Solo admin
        validateObjectId,
        async (req, res, next) => {
            // Verificar que el staff no tenga relaciones importantes
            const staffId = req.params.id;
            const hasUsers = await mongoose.model('User').countDocuments({ staffId });
            
            if (hasUsers > 0) {
                console.error('No se puede eliminar - Staff tiene usuarios asociados');
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar el personal porque tiene usuarios asociados'
                });
            }
            next();
        }
    ],
    staffController.deleteStaff
);

// ----------------------------
// Métodos adicionales útiles
// ----------------------------

// Obtener personal por tipo
router.get(
    '/type/:id',
    [
        requestLogger,
        verifyToken,
        readWriteAccess, // Admin y coordinador
        validateObjectId,
        check('includeInactive').optional().isBoolean().withMessage('includeInactive debe ser true o false')
    ],
    staffController.getStaffByType
);

// Buscar personal por identificación o nombre
router.get(
    '/search/term',
    [
        requestLogger,
        verifyToken,
        filterByRole,
        check('term')
            .not().isEmpty().withMessage('El término de búsqueda es obligatorio')
            .isLength({ min: 3 }).withMessage('El término debe tener al menos 3 caracteres')
            .trim()
            .escape() // Prevenir XSS
    ],
    staffController.searchStaff
);

console.log('Rutas de Staff configuradas correctamente');

module.exports = router;