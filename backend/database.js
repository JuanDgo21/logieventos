const mongoose = require('mongoose');
const {DB_URI} = require('./config');

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI, {
            userNewUtlParser: true,
            useUifiedTopology: true,
        });
        console.log('MongoDB Conectado');
    } catch(err){
        console.error('X error de conexion a MongoDB'), err.message;
        process.exit(1);
    }
};

module.exports = connectDB;