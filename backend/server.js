require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');

// Importar rutas principales
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

// Importar el nuevo controlador de reportes
const reportController = require('./controllers/reportControllers');

// Configurar aplicación Express
const app = express();

// Conexión directa a MongoDB para operaciones específicas
const mongoClient = new MongoClient(process.env.MONGODB_URI);

// CORRECCIÓN: Uso de top-level await en lugar de IIFE
try {
  await mongoClient.connect();
  app.set('mongoDb', mongoClient.db());
  console.log('Conexión directa a MongoDB establecida');
} catch (error) {
  console.error('Error al conectar a MongoDB directamente:', error.message);
}

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conexión a MongoDB con Mongoose
// CORRECCIÓN: Uso de top-level await en lugar de promise chain
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conexión a MongoDB exitosa');
} catch (error) {
  console.error('Error de conexión a MongoDB:', error.message);
}

// ======================================
// Configuración de Rutas
// ======================================

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/contracts', contractRoutes); // <-- Aquí están las rutas básicas de contratos
app.use('/api/resources', resourceRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/provider-types', providerTypeRoutes);
app.use('/api/personnel-types', personnelTypeRoutes);
app.use('/api/resource-types', resourceTypeRoutes);
app.use('/api/reports', reportRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Gestión de Eventos y Logística' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});

// Manejo de cierre limpio
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  await mongoClient.close();
  console.log('Conexiones a MongoDB cerradas');
  process.exit(0);
});