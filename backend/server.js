require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const contractRoutes = require('./routes/contractRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const providerRoutes = require('./routes/providerRoutes');
const personnelRoutes = require('./routes/personnelRoutes');
const eventTypeRoutes = require('./routes/eventTypeRoutes');
const providerTypeRoutes = require('./routes/providerTypeRoutes');
const personnelTypeRoutes = require('./routes/personnelTypeRoutes');
const resourceTypeRoutes = require('./routes/resourceTypeRoutes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/provider-types', providerTypeRoutes);
app.use('/api/personnel-types', personnelTypeRoutes);
app.use('/api/resource-types', resourceTypeRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'API de Gestión de Eventos y Logística' });
});

// ========================================================
// ⚠️ CORRECCIÓN: RUTA DE PRUEBA ANTES DEL ERROR HANDLER
// ========================================================
/* istanbul ignore next */
if (process.env.NODE_ENV === 'test') {
    app.get('/_force_error_test', (req, res, next) => {
        const error = new Error('Error Simulado');
        next(error);
    });
}

// Manejo de errores (DEBE SER LO ÚLTIMO EN RUTAS)
app.use((err, req, res, next) => {
    // Si no es test, imprimimos el error (para no ensuciar la consola en tests)
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'test') console.error(err.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor'
    });
});

// ========================================================
// ARRANQUE DEL SERVIDOR (Ignorado en coverage)
// ========================================================

/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
    const startServer = async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Conexión a MongoDB exitosa');
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log(`Servidor en ejecución en http://localhost:${PORT}`);
            });
        } catch (error) {
            console.error(error);
        }
    };
    startServer();
}

module.exports = app;