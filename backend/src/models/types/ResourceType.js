const mongoose = require('mongoose');

const resourceTypeSchema = new mongoose.Schema({
    resourceTypeId: {  // Antes: totipo_recursos
        type: Number,
        required: true,
        unique: true
    },
    typeName: {  // Antes: tipo_recursos
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    }
}, { timestamps: true });

module.exports = mongoose.model('ResourceType', resourceTypeSchema);