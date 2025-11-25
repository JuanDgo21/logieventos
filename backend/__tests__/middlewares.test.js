const { authJwt, role } = require('../middlewares');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

// Mockeamos Response y Next
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockNext = jest.fn();

describe('Pruebas Unitarias: Middlewares', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- AUTH JWT ---
    describe('verifyToken', () => {
        it('Debería fallar si no se provee token (403)', () => {
            const req = { headers: {} }; // Sin headers
            const res = mockRes();

            authJwt.verifyToken(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Token no proporcionado'
            }));
        });

        it('Debería fallar si el token es inválido (401)', () => {
            const req = { headers: { 'x-access-token': 'token_falso_123' } };
            const res = mockRes();

            // Simulamos que jwt.verify explota
            jest.spyOn(jwt, 'verify').mockImplementation(() => {
                throw new Error('Token inválido');
            });

            authJwt.verifyToken(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('Debería llamar a next() si el token es válido', () => {
            const req = { headers: { 'x-access-token': 'token_real' } };
            const res = mockRes();
            
            // Simulamos éxito al verificar
            jest.spyOn(jwt, 'verify').mockReturnValue({ id: '123', role: 'admin' });

            authJwt.verifyToken(req, res, mockNext);

            expect(req.userId).toBe('123');
            expect(mockNext).toHaveBeenCalled();
        });
    });

    // --- ROLES (isAdmin) ---
    describe('isAdmin', () => {
        it('Debería permitir paso si el rol es admin', async () => {
            const User = require('../models/User');
            
            // IMPORTANTE: Pasamos userRole para evitar el error 500
            const req = { userId: '123', userRole: 'admin' }; 
            const res = mockRes();
            
            // Mock de DB por si acaso
            jest.spyOn(User, 'findById').mockResolvedValue({ _id: '123', role: 'admin' });

            await role.isAdmin(req, res, mockNext);
            
            expect(mockNext).toHaveBeenCalled();
        });

        it('Debería bloquear si el rol NO es admin (403)', async () => {
            const User = require('../models/User');
            
            // Simulamos usuario Líder
            const req = { userId: '456', userRole: 'lider' };
            const res = mockRes();
            
            jest.spyOn(User, 'findById').mockResolvedValue({ _id: '456', role: 'lider' });

            await role.isAdmin(req, res, mockNext);
            
            // Verificamos bloqueo
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                // CORRECCIÓN: Ajustado al mensaje real de tu backend
                message: expect.stringMatching(/no tienes los permisos/i) 
            }));
        });
    });
});