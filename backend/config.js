module.exports = {
    // 1. Configuracion de JWT
    SECRET: process.env.JWT_SECRET || 'Tu_clave_secreta_para_desarrollo',
    TOKEN_EXPIRATION: process.env.TOKEN_EXPIRATION || '24',

    // 2. Configuracion de base de datos
    DB: {
        URL: process.env.MONGODB_URI || 'mongodb://localhost:27017/logieventos',
        OPTIONS:{
            userNewUrlParser:true,
            useUnifiedTopology:true
        }
    },

    // 3. Roles del sistema (deben coincidir con tu implementacion)
    ROLES:{
        ADMIN: 'admin',
        COORDINADOR: 'coordinador',
        LIDER: 'lider'
    }
}