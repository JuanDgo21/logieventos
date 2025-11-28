const jwt = require('jsonwebtoken');
const { verifyToken, authJWT } = require('../middlewares/authJwt');
const config = require('../config/auth.config.js');

// --- MOCKS ---
jest.mock('jsonwebtoken');
jest.mock('../config/auth.config.js', () => ({
    secret: 'test-secret-key'
}));
// Mockeamos el modelo User para evitar errores de conexión a DB al importar el middleware
jest.mock('../models/User.js', () => ({
    User: {}
}));

describe('Pruebas Unitarias: Middleware AuthJWT', () => {
    let req, res, next;

    // Reiniciamos los objetos antes de cada prueba
    beforeEach(() => {
        req = {
            headers: {},
            originalUrl: '/api/test'
        };
        res = {
            status: jest.fn().mockReturnThis(), // Permite encadenar .status().json()
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    // =================================================================
    // 1. PRUEBAS PARA verifyTokenFn (Middleware Principal)
    // =================================================================
    describe('verifyTokenFn (Principal)', () => {
        
        it('Debería llamar a next() si el token es válido (x-access-token)', () => {
            req.headers['x-access-token'] = 'valid-token';
            const decodedMock = { id: 'user123', role: 'admin' };
            
            // Simulamos que jwt.verify devuelve el payload decodificado
            jwt.verify.mockReturnValue(decodedMock);

            verifyToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret-key');
            expect(req.userId).toBe('user123');
            expect(req.userRole).toBe('admin');
            expect(next).toHaveBeenCalled();
        });

        it('Debería llamar a next() si el token es válido (Authorization: Bearer)', () => {
            req.headers['authorization'] = 'Bearer valid-token-bearer';
            jwt.verify.mockReturnValue({ id: 'user456', role: 'user' });

            verifyToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token-bearer', 'test-secret-key');
            expect(req.userId).toBe('user456');
            expect(next).toHaveBeenCalled();
        });

        it('Error 403: Si no se provee token', () => {
            verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Token no proporcionado'
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('Error 401: Token Expirado', () => {
            req.headers['x-access-token'] = 'expired-token';
            // Simulamos error de expiración
            const error = new Error('Expired');
            error.name = 'TokenExpiredError';
            jwt.verify.mockImplementation(() => { throw error; });

            verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Token expirado'
            }));
        });

        it('Error 401: Token Inválido (Cualquier otro error)', () => {
            req.headers['x-access-token'] = 'invalid-token';
            const error = new Error('Invalid');
            error.name = 'JsonWebTokenError';
            jwt.verify.mockImplementation(() => { throw error; });

            verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Token inválido'
            }));
        });
    });

    // =================================================================
    // 2. PRUEBAS PARA AuthJWT (Middleware Deprecated)
    // =================================================================
    describe('AuthJWT (Deprecated)', () => {
        
        it('Debería llamar a next() si el token es válido', () => {
            req.headers['authorization'] = 'Bearer valid-legacy-token';
            const decodedMock = { id: 'legacyUser' };
            jwt.verify.mockReturnValue(decodedMock);

            authJWT(req, res, next);

            expect(jwt.verify).toHaveBeenCalled();
            expect(req.user).toEqual(decodedMock);
            expect(next).toHaveBeenCalled();
        });

        it('Error 401: Si no se provee token', () => {
            // Sin headers
            authJWT(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Token no proporcionado'
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('Error 401: Si el token es inválido (Cubre el catch block)', () => {
            req.headers['authorization'] = 'Bearer invalid-legacy-token';
            jwt.verify.mockImplementation(() => { throw new Error('Legacy Error'); });

            authJWT(req, res, next);

            // Esto cubre las líneas 84-85 (el catch block de AuthJWT)
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Token inválido'
            }));
        });
    });

});