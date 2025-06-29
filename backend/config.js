module.exports = {
    //1. Configuracion de JWT
    SECRET: process.env.JWT_SECRET || 'iphone',
    TOKEN_EXPIRATION: process.env.TOKEN_EXPIRATION || '24',

    //2. Configuracion de base de datos
    DB:{
        URL: process.env.MONGODB_URI || 'mongodb://localhost:27017/logieventos',
        OPTIONS:{
            userNewUrlParser:true,
            useUnifiedTopology:true
        }
    },

    //3. Roles del sistema (deben coincidir con tu implementacion)
    ROLES:{
        ADMIN: 'admin',
        COORDiNADOR: 'coordinador',
        AUXILIAR: 'auxiliar'
    }
}