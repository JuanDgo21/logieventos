const User = require('../models/core/User');
const ROLES = ['admin', 'coordinador', 'lider', 'user'];

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        // Verificar documento (cambia username por document)
        const userByDocument = await User.findOne({ document: req.body.document });
        if (userByDocument) {
            return res.status(400).json({ 
                success: false, 
                message: "El número de documento ya está registrado" 
            });
        }
        
        // Verificar email (este se mantiene igual)
        const userByEmail = await User.findOne({ email: req.body.email });
        if (userByEmail) {
            return res.status(400).json({ 
                success: false, 
                message: "El email ya está en uso" 
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error al verificar registro", 
            error: error.message 
        });
    }
};

const checkRolesExisted = (req, res, next) => {
    if (req.body.role) {
        if (!ROLES.includes(req.body.role)) {
            return res.status(400).json({
                success: false,
                message: `Rol ${req.body.role} no existe`
            });
        }
    }
    next();
};

module.exports = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted
};