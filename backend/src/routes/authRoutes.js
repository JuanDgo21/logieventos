const express = require('express');
const router = express.Router();
const authController = require('');
const { verify } = require('jsonwebtoken');
const verifyRegister = require('');

// Importación de verificación
let verifyToken;
try {
    const authJwt = require('');
    verifyToken = authJwt.verifyToken;
    console.log('[AuthRoutes] verifyToken importado correctamente', typeof verifyToken);
} catch(error) {
    console.log('[AuthRoutes] ERROR al importar verifyToken', error);
    throw error;
}

// Middleware de diagnostico
router.use((req, res, next)) => {

}