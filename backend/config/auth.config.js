require('dotenv').config();

module.exports={
    secret: process.env.AUTH_SECRET || '123456',
    jwtExpiration: process.env.JWT_EXPIRATION || 86400, // 24 horas en segundos
    saltRounds: process.env.SALT_ROUNDS || 8
};