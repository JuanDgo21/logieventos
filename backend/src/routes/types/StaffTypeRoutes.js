const express = require('express');
const router = express.Router();
const staffTypeController = require('../../controllers/types/StaffTypeController');
const { verifyToken } = require('../../middlewares/authJwt');
const { isAdmin, isCoordinador, isLider } = require('../../middlewares/role');
const { check } = require('express-validator');
const mongoose = require('mongoose');

console.log('Inicializando rutas de StaffType...'); // Log de inicialización

// Validaciones comunes para el tipo de personal
const validateStaffType = [
    check('name')
        .notEmpty().withMessage('El nombre es obligatorio').bail()
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener entre 3 y 50 caracteres').bail()
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios').bail()
        .custom(value => {
            const allowedValues = [
                'Coordinación y Gestión', 
                'Personal Técnico', 
                'Servicios Generales',
                'Seguridad',
                'Logística'
            ];
            if (!allowedValues.includes(value)) {
                console.error(`Nombre no válido proporcionado: ${value}`); // Log de error
                throw new Error('Nombre de tipo de personal no válido');
            }
            return true;
        }),
    
    check('description')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('La descripción no puede exceder los 300 caracteres')
        .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,;:!?()-]+$/).withMessage('La descripción contiene caracteres no permitidos'),
    
    check('isActive')
        .optional()
        .isBoolean().withMessage('El estado activo debe ser un valor booleano')
];

// Middleware para validar ObjectId con logs
const validateObjectId = (req, res, next) => {
    console.log(`Validando ID: ${req.params.id}`); // Log de validación
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.error(`ID inválido recibido: ${req.params.id}`); // Log de error
        return res.status(400).json({ 
            success: false, 
            message: 'ID inválido',
            details: 'El ID proporcionado no tiene el formato correcto de MongoDB ObjectId'
        });
    }
    next();
};

// Middleware para registro de solicitudes
const requestLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    next();
};

// 1.1 Crear tipo de personal (Admin)
router.post('/', 
    verifyToken, 
    isAdmin,
    requestLogger,
    validateStaffType,
    (req, res, next) => {
        console.log('Validaciones pasadas, procediendo a crear tipo de personal...');
        next();
    },
    staffTypeController.createStaffType
);

// 1.2 Obtener todos los tipos
router.get('/', 
    verifyToken,
    requestLogger,
    (req, res, next) => {
        console.log(`Usuario rol: ${req.user.role}`); // Log del rol del usuario
        
        // Filtro para no admin
        if (req.user.role !== 'admin') {
            console.log('Aplicando filtro activeOnly para usuario no admin');
            req.query.activeOnly = true;
        }
        next();
    },
    staffTypeController.getStaffTypes
);

// 1.2.1 Obtener un tipo específico
router.get('/:id', 
    verifyToken,
    requestLogger,
    validateObjectId,
    (req, res, next) => {
        console.log(`Solicitando tipo de personal con ID: ${req.params.id}`);
        next();
    },
    staffTypeController.getStaffTypeById
);

// 1.3 Actualizar tipo (Admin)
router.put('/:id', 
    verifyToken,
    isAdmin,
    requestLogger,
    validateObjectId,
    validateStaffType,
    (req, res, next) => {
        console.log(`Actualizando tipo de personal ID: ${req.params.id}`);
        console.log('Datos recibidos:', req.body);
        next();
    },
    staffTypeController.updateStaffType
);

// 1.4 Desactivar tipo (Admin)
router.patch('/:id/deactivate', 
    verifyToken,
    isAdmin,
    requestLogger,
    validateObjectId,
    (req, res, next) => {
        console.log(`Desactivando tipo de personal ID: ${req.params.id}`);
        next();
    },
    staffTypeController.deactivateStaffType
);

// 1.5 Eliminar tipo (Admin)
router.delete('/:id', 
    verifyToken,
    isAdmin,
    requestLogger,
    validateObjectId,
    (req, res, next) => {
        console.log(`Eliminando tipo de personal ID: ${req.params.id}`);
        next();
    },
    staffTypeController.deleteStaffType
);

// Obtener personal por tipo (Admin y Coordinador)
router.get('/:id/staff', 
    verifyToken,
    requestLogger,
    (req, res, next) => {
        console.log(`Verificando permisos para usuario rol: ${req.user.role}`);
        
        if (!['admin', 'coordinador'].includes(req.user.role)) {
            console.error('Acceso denegado para rol:', req.user.role);
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso no autorizado',
                requiredRoles: ['admin', 'coordinador'],
                yourRole: req.user.role
            });
        }
        next();
    },
    validateObjectId,
    (req, res, next) => {
        console.log(`Obteniendo personal para tipo ID: ${req.params.id}`);
        next();
    },
    staffTypeController.getStaffByType
);

console.log('Rutas de StaffType configuradas correctamente'); // Log de finalización

module.exports = router;