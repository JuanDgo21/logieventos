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
// (FALSO POSITIVO S7785: Este IIFE es necesario en CommonJS, no lo cambies)
const mongoClient = new MongoClient(process.env.MONGODB_URI);
(async () => {
  try {
    await mongoClient.connect();
    app.set('mongoDb', mongoClient.db());
    console.log('Conexión directa a MongoDB establecida');
  } catch (error) {
    console.error('Error al conectar a MongoDB directamente:', error.message);
  }
})();

// --- Configuración de CORS ---

// 1. Define tu "Lista Blanca" de dominios permitidos
// ✅ CORRECCIÓN (S7776): Se convierte el Array en un Set para optimizar búsquedas.
const allowedOrigins = new Set([
  'http://localhost:4200', // Tu frontend de Angular en desarrollo
  // 'https://logieventos.com', // ❗️ DESCOMENTA Y AÑADE TU DOMINIO DE PRODUCCIÓN
  // 'https://www.logieventos.com' // ❗️ AÑADE www si es necesario
]);

// 2. Configura las opciones de CORS
const corsOptions = {
  origin: function (origin, callback) {
    
    // ✅ CORRECCIÓN (S7776): Se usa .has() (O(1)) en lugar de .includes() (O(n))
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acceso no permitido por CORS'));
    }
  },
  credentials: true // Permite que el frontend envíe cookies/tokens de autenticación
};

// --- Fin de la Corrección ---


// Middlewares
app.use(cors(corsOptions)); // Aplica las opciones de CORS
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB con Mongoose
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch(error => console.error('Error de conexión a MongoDB:', error.message));

// ======================================
// Configuración de Rutas
// ======================================

// Rutas principales
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
// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Gestión de Eventos y Logística' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  // Manejo de error específico de CORS
  if (err.message === 'Acceso no permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Error de CORS: Este origen no tiene permiso para acceder a la API.'
    });
  }
  
  // Manejo de error genérico
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