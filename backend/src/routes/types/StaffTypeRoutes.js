const express = require('express');
const router = express.Router();
const staffTypeController = require('../../controllers/types/StaffTypeController');
const { verifyToken } = require('../../middlewares/authJwt');
const { isAdmin, isCoordinador, isLider } = require('../../middlewares/role');
const { check } = require('express-validator');
const mongoose = require('mongoose');

// Validaciones comunes
const validateStaffType = [
    check('name').notEmpty().withMessage('El nombre es obligatorio').trim(),
    check('description').optional().trim()
];

// Middleware para validar ObjectId
const validateObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID inválido' 
        });
    }
    next();
};

// 1.1 Crear tipo de personal (Admin) -- ya se realizo la prueba 
router.post('/', 
    verifyToken, 
    isAdmin,
    validateStaffType,
    staffTypeController.createStaffType
);

// 1.2 Obtener todos los tipos -- ya se realizo la prueba 
router.get('/', 
    verifyToken,
    (req, res, next) => {
        // Filtro para no admin
        if (req.user.role !== 'admin') {
            req.query.activeOnly = true;
        }
        next();
    },
    staffTypeController.getStaffTypes
);

// 1.2.1 Obtener un tipo específico -- ya se realizo la prueba 
router.get('/:id', 
    verifyToken,
    validateObjectId,
    staffTypeController.getStaffTypeById
);

// 1.3 Actualizar tipo (Admin) -- ya se realizo la prueba 
router.put('/:id', 
    verifyToken,
    isAdmin,
    validateObjectId,
    validateStaffType,
    staffTypeController.updateStaffType
);

// 1.4 Desactivar tipo (Admin)
router.patch('/:id/deactivate', 
    verifyToken,
    isAdmin,
    validateObjectId,
    staffTypeController.deactivateStaffType
);

// 1.5 Eliminar tipo (Admin) -- ya se realizo la prueba 
router.delete('/:id', 
    verifyToken,
    isAdmin,
    validateObjectId,
    staffTypeController.deleteStaffType
);

// Obtener personal por tipo (Admin y Coordinador)
router.get('/:id/staff', 
    verifyToken,
    (req, res, next) => {
        if (!['admin', 'coordinador'].includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso no autorizado' 
            });
        }
        next();
    },
    validateObjectId,
    staffTypeController.getStaffByType
);

module.exports = router;