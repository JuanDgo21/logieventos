const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    resourceId: {  // Antes: idRecursos
        type: Number,
        required: true
    },
    name: {  // Antes: nombreRecursos
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    quantity: {  // Antes: cantidadRecursos
        type: Number,
        required: true
    },
    availability: {  // Antes: disponibilidadR
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    maintenance: {  // Antes: mantenimientoR
        type: String,
        required: true,
        trim: true,
        maxlength: 45
    },
    resourceTypeId: {  // Nueva propiedad: referencia a ResourceType
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResourceType',  // Relación con el modelo ResourceType
        required: true  // Obligatorio para crear un recurso
    }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);