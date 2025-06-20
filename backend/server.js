require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const{MongoClient, ObjectId} = require('mongodb');

// Importar rutas
const authRoutes = require('./src/routes/auth/authRoutes');
const userRoutes = require('./src/routes/auth/userRoutes');
const contractRoutes = require('./src/routes/core/contractRoutes');
const eventTypeRoutes = require('./src/routes/types/eventTypeRoutes');
const eventRoutes = require('./src/routes/core/eventRoutes');
const resourceTypeRoutes = require('./src/routes/types/resourceTypeRoutes');
const resourceRoutes = require('./src/routes/core/resourceRoutes');
const staffTypeRoutes = require('./src/routes/types/staffTypeRoutes');
const staffRoutes = require('./src/routes/core/staffRoutes');
const supplierTypeRoutes = require('./src/routes/types/supplierTypeRoutes');
const supplierRoutes = require('./src/routes/core/supplierRoutes');
const repportRoutes = require('./src/routes/support/reportRoutes');

// Primero declaramos la app
const app = express();

// Luego usamos la app
const mongoClient = new MongoClient(process.env.MONGODB_URI);
(async ()=>{
    await mongoClient.connect();
    app.set('mongoDb', mongoClient.db());
    console.log('Conexión directa a mongoDB establecida'); // Corregir typo
})();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Conexion a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(error => console.error('❌ Error de conexión:', error.message));

/* // Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡API LogiEventos funcionando!');
}); */

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/resource-types', resourceTypeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/staff-types', staffTypeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/supplier-types', supplierTypeRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', repportRoutes);

// Iniciar servidor
app.listen(process.env.PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${process.env.PORT}`);
})