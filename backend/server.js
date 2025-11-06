import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import { MongoClient } from 'mongodb';

// Importar rutas principales
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import personnelRoutes from './routes/personnelRoutes.js';
import eventTypeRoutes from './routes/eventTypeRoutes.js';
import providerTypeRoutes from './routes/providerTypeRoutes.js';
import personnelTypeRoutes from './routes/personnelTypeRoutes.js';
import resourceTypeRoutes from './routes/resourceTypeRoutes.js';
import reportRoutes from './routes/report.routes.js';

// Configurar aplicación Express
const app = express();

// Conexión directa a MongoDB para operaciones específicas
const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Función asíncrona para inicializar la aplicación
async function initializeApp() {
  try {
    // Conexión directa a MongoDB
    await mongoClient.connect();
    app.set('mongoDb', mongoClient.db());
    console.log('Conexión directa a MongoDB establecida');

    // Conexión a MongoDB con Mongoose
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conexión a MongoDB exitosa');

    // Middlewares
    app.use(cors());
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

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

  } catch (error) {
    console.error('Error durante la inicialización:', error.message);
    process.exit(1);
  }
}

// Inicializar la aplicación
initializeApp();