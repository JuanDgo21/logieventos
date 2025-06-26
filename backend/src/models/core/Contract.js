const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    name :{
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        unique: true  
    },

    description :{
        type: String,
        required: [true, 'La descripcion es obligatorio'],
        trim: true
    },

    clientname : {
        type: String,
        required: [true, 'El nombre del cliente es obligatorio'],
        trim: true
    },

    clientphone : {
        type: Number,
        required: true,
        trim: true,
        match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.][0-9]{1,4}[-\s.]?[0-9]{1,6}$/, 'Telefono no valido']
    },

    clientemail : {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email no valido']
    },
    
    date : {
        type: Date,
        required: [true, 'La fecha es obligatoria']
    },

    sign : {
        type: String,
        validate: {
            validator: (v) => !v || v.startsWith('data:image/') || v.startsWith('http'),
            message: 'La firma debe de ser una URL o Base64 de imagen'
        }
    },
}, {
    timestamps: true,
    versionKey:false
});


module.exports = mongoose.model('Contract', contractSchema)

