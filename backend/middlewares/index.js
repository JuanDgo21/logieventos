// Importa los middlewares necesarios para el sistema de autenticación y autorización
const authJwt = require('./authJwt');       // Middleware para autenticación JWT
const verifySignup = require('./verifySignUp'); // Middleware para validar registro de usuarios
const role = require('./role');             // Middleware para manejo de roles y permisos

// Exporta los middlewares como un objeto para poder importarlos fácilmente desde otros archivos
// Esto permite un acceso organizado a todas las funciones de middleware
module.exports = {
    authJwt: require('./authJwt'),       // Exporta middleware de autenticación JWT
    verifySignup: require('./verifySignUp'), // Exporta validaciones de registro
    role: require('./role')              // Exporta manejo de roles
};