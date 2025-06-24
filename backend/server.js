require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');

// Importar Rutas
const authRoutes = require('./src/routes/auth/authRoutes');
const userRoutes = require('./src/routes/auth/userRoutes');
const contractRoutes = require('./src/routes/core/contractRoutes');
const eventRoutes = require('./src/routes/core/eventRoutes');
const resourceRoutes = require('./src/routes/core/resourceRoutes');
const staffRoutes = require('./src/routes/core/StaffRoutes');
const supplierRoutes = require('./src/routes/core/supplierRoutes');
const reportRoutes = require('./src/routes/support/reportRoutes');
const eventTypeRoutes = require('./src/routes/types/eventTypeRoutes');
const resourceTypeRoutes = require('./src/routes/types/resourceTypeRoutes');
const staffTypeRoutes = require('./src/routes/types/StaffTypeRoutes');
const supplierTypeRoutes = require('./src/routes/types/supplierTypeRoutes');

const mongoClient = new MongoClient(process.env.MONGODB_URI);
const app = express();

// Conexión directa a MongoDB (para operaciones que no requieren Mongoose)
(async () => {
    try {
        await mongoClient.connect();
        app.set('mongoDb', mongoClient.db());
        console.log('✅ Conexión directa a MongoDB establecida');
    } catch (err) {
        console.error('❌ Error en conexión directa a MongoDB:', err);
    }
})();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB con Mongoose
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado a MongoDB mediante Mongoose'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/resource-types', resourceTypeRoutes);
app.use('/api/staff-types', staffTypeRoutes);
app.use('/api/supplier-types', supplierTypeRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡API LogiEventos funcionando!');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
});