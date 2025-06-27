const mongoose = require('mongoose');

const resourceTypeSchema = new mongoose.Schema({
    typeName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 45,
    }
}, { timestamps: true });

module.exports = mongoose.model('ResourceType', resourceTypeSchema);