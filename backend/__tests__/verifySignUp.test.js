const { 
    checkDuplicateUsernameOrEmail, 
    checkRolesExisted 
} = require('../middlewares/verifySignUp');
const User = require('../models/User');

// --- MOCKS ---
// Mockeamos el modelo User para no depender de la DB
jest.mock('../models/User');

describe('Pruebas Unitarias: Middleware VerifySignUp', () => {
    let req, res, next;

    // Reiniciamos objetos antes de cada test
    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    // =================================================================
    // 1. PRUEBAS PARA checkDuplicateUsernameOrEmail
    // =================================================================
    describe('checkDuplicateUsernameOrEmail', () => {
        
        it('Error 400: Faltan campos username o email', async () => {
            req.body = { username: 'soloUser' }; // Falta email
            
            await checkDuplicateUsernameOrEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Username y email son requeridos"
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('Error 400: Username ya existe', async () => {
            req.body = { username: 'dupUser', email: 'new@mail.com' };
            
            // Mockeamos findOne. La función usa Promise.all([user, email])
            // findOne devuelve un objeto Query que necesita tener .collation()
            // Simulamos que el primer findOne (username) encuentra algo, el segundo (email) no.
            
            const mockQuery = {
                collation: jest.fn()
            };

            // Implementación encadenada: User.findOne().collation()
            User.findOne.mockReturnValue(mockQuery);
            
            // mockResolvedValueOnce para username (encuentra)
            // mockResolvedValueOnce para email (null)
            mockQuery.collation
                .mockResolvedValueOnce({ _id: 'id1', username: 'dupUser' }) 
                .mockResolvedValueOnce(null);

            await checkDuplicateUsernameOrEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "El nombre de usuario ya está en uso"
            }));
        });

        it('Error 400: Email ya existe', async () => {
            req.body = { username: 'newUser', email: 'dup@mail.com' };
            
            const mockQuery = { collation: jest.fn() };
            User.findOne.mockReturnValue(mockQuery);

            // Username null, Email encuentra objeto
            mockQuery.collation
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ _id: 'id2', email: 'dup@mail.com' });

            await checkDuplicateUsernameOrEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "El email ya está en uso"
            }));
        });

        it('Error 400: Ambos (Username y Email) existen', async () => {
            req.body = { username: 'dupUser', email: 'dup@mail.com' };
            
            const mockQuery = { collation: jest.fn() };
            User.findOne.mockReturnValue(mockQuery);

            // Ambos encuentran objeto
            mockQuery.collation
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({});

            await checkDuplicateUsernameOrEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "El nombre de usuario y el email ya están en uso"
            }));
        });

        it('Éxito: Username y Email disponibles', async () => {
            req.body = { username: 'freeUser', email: 'free@mail.com' };
            
            const mockQuery = { collation: jest.fn() };
            User.findOne.mockReturnValue(mockQuery);

            // Ambos devuelven null
            mockQuery.collation
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            await checkDuplicateUsernameOrEmail(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('Error 500: Fallo en base de datos', async () => {
            req.body = { username: 'test', email: 'test@mail.com' };
            
            // Forzamos error al intentar crear la query
            User.findOne.mockImplementation(() => { throw new Error('DB Crash'); });

            await checkDuplicateUsernameOrEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Error interno al validar credenciales"
            }));
        });
    });

    // =================================================================
    // 2. PRUEBAS PARA checkRolesExisted
    // =================================================================
    describe('checkRolesExisted', () => {
        
        it('Éxito: Rol válido (admin)', () => {
            req.body = { role: 'admin' };
            checkRolesExisted(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('Éxito: Rol válido (lider)', () => {
            req.body = { role: 'lider' };
            checkRolesExisted(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('Éxito: No se envía rol (es opcional)', () => {
            req.body = {}; // Sin propiedad role
            checkRolesExisted(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('Error 400: Rol inválido', () => {
            req.body = { role: 'super_dios' };
            checkRolesExisted(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/Rol no válido/)
            }));
            expect(next).not.toHaveBeenCalled();
        });
    });

});