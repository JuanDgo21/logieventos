const User = require('../models/core/User');
const ROLES = ['admin', 'coordinador', 'lider', 'user'];

const checkDuplicateUsernameOrEmail = async (req, res,next) => {
    try {
        // Verificar username
        const userByUsername = await User.findOne({ username: req.body.username });
        if (userByUsername) {
            return res.status(400).json({ 
                success: false, 
                message: "El nombre de usuario ya está en uso" 
            });
        }
        
        // Verificar email
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
            message: "Error al verificar usuario/email", 
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