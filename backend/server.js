require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyparser = require('body-parser');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyparser.json());

// Conexion a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión:', err));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡API LogiEventos funcionando!');
});

// Iniciar servidor
app.listen(process.env.PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${process.env.PORT}`);
})