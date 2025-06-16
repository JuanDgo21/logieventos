const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    documento: {
        type: Number,
        required: true,
        unique: true,
        trim: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.][0-9]{1,4}[-\s.]?[0-9]{1,6}$/, 'Telefono no valido']
    },
    password: {
        type: String,
        required: true,
        select: false // No devolver el password en las consultas
    },
    role: {
        type: String,
        enum: ['admin', 'coordinador', 'lider'],
        default: 'lider'
    }
}, { timestamps: true });

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch(error) {
        next(error);
    }
});

// Metodo para comparar constraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);