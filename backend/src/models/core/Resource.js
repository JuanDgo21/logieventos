const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    quantity: {
        type: Number,
        required: true
    },
    availability: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    maintenance: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    resourceType: {  // Cambiado de resourceTypeId a resourceType para mejor semántica
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResourceType',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);