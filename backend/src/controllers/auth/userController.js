const { connect } = require('mongoose');
const User = require('../../models/core/User');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios (Solo Admin)
exports.getAllusers = async (req, res) => {
    console.log('[CONTROLLER] Ejecutando getAllusers');
    try {
        let users;

        if (req.userRole === 'lider') {
            // Solo ve su propio usuario
            users = await User.find({ _id: req.userId }).select('-password');
        } else if (req.userRole === 'coordinador') {
            // No puede ver a los administradores
            users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        } else {
            // Admin ve todo
            users = await User.find().select('-password');
        }
        
        console.log('[CONTROLLER] - getAllUsers Users found:', users.length);
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('[CONTROLLER] - getAllUsers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving users',
            error
        });
    }
};

// Obtener usuario especifico
exports.getUserById = async(req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user){
            return res.status(404).json({
                success: false,
                message:'Usuario no encontrado'
            });
        }
        // Validaciones de acceso
        if (req.userRole === 'lider' && req.userId !== user._id.toString()){
            return res.status(403).json({
                success: false,
                message:'No puedes ver usuario admin'
            });
        }
        if(req.userRole === 'coordinador' && user.role === 'admin'){
            return res.status(403).json({
                success: false,
                message:'No puedes ver usuario admin'
            });
        }
        res.status(200).json({
            success: true,
            user
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario', error: error.message
        });
    }
};

// Crear usuario (Admin y Coordinador)
exports.createUser = async (req, res) => {
    try {
        const { document, name, email, password, role } = req.body;

        const user = new User({
            document,
            name,
            email,
            password: await bcrypt.hash(password, 10),
            role
        });
        const savedUser = await user.save();
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            user: {
                id: savedUser._id,
                document: savedUser.document,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role
            }
        });
    } catch (error){
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario', error:error.message
        });
    }
};

// Actualizar usuario (Admin y Coordinador)
exports.updateUser = async(req, res) => {
    try{
        const updateUser = await User.findByIdAndUpdate(req.params.id,
            {$set: req.body},
            {new: true}
        ).select('-password');

        if (!updatedUser){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado correctamente',
            user: updatedUser
        });
    } catch(error){
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// Eliminar usuario (Solo Admin)
exports.deleteUser = async(req, res)=> {
    console.log('[CONTROLLER] Ejecutando deleteUser para ID:', req.params.id); // Diagnostico
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser){
            console.log('[CONTROLLER] Usuario no encontrado para eliminar'); // Diagnostico
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        console.log('[CONTROLLER] Usuario eliminado:', deletedUser._id); // Diagnostico
        res.status(200).json({
            success:true,
            message: 'Usuario eliminado correctamente'
        });
    } catch(error){
        console.error('[CONTROLLER] Error al eliminar usuario', error.message); //Diagnostico
        res.status(500).json({
            success:false,
            message: 'Error al eliminar usuario'
        });
    }
};