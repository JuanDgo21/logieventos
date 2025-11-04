const mongoose = require('mongoose');
const {DB_URI} = require('./config');


const connectDB = async () => {
    try{
        // ✅ CORRECIÓN (Fiabilidad):
        // Se eliminaron las opciones obsoletas/con typos (useNewUrlParser, useUnifiedTopology).
        // Mongoose 6+ ya las usa por defecto.
        await mongoose.connect(DB_URI);
        
        console.log('OK MongoDB conectado');
        
    }catch(err){
        // ✅ CORRECCIÓN (S905): 
        // Se pasa err.message como segundo argumento a console.error
        // en lugar de usarlo con un operador coma.
        console.error('X error de conexion a MongoDB', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;