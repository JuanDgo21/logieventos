const { 
    checkRole, 
    isAdmin, 
    isCoordinador, 
    isLider, 
    checkMultipleRoles 
} = require('../middlewares/role');

describe('Pruebas Unitarias: Middleware de Roles (role.js)', () => {
    let req, res, next;

    // Reiniciamos los objetos antes de cada prueba
    beforeEach(() => {
        req = {
            userRole: '',       // Rol del usuario actual
            method: 'GET',
            originalUrl: '/api/test',
            userId: 'user123'
        };
        res = {
            status: jest.fn().mockReturnThis(), // Permite encadenar .status().json()
            json: jest.fn()
        };
        next = jest.fn();
        
        // Silenciamos los console.log y console.warn para no ensuciar el output de los tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =================================================================
    // 1. PRUEBAS PARA checkRole (Función Genérica)
    // =================================================================
    describe('checkRole (Genérico)', () => {
        
        // Cubre líneas 11-12: Verificación de seguridad básica
        it('Error 500: Si req.userRole no está definido (Fallo de Auth previo)', () => {
            req.userRole = undefined; // Simulamos que el middleware de auth falló o no se ejecutó
            
            const middleware = checkRole('admin');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 'ROLE_VERIFICATION_ERROR',
                message: expect.stringMatching(/error interno/i)
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('Permitir acceso: Rol coincide (string input)', () => {
            req.userRole = 'admin';
            // checkRole retorna una función, hay que ejecutarla
            const middleware = checkRole('admin'); 
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it('Permitir acceso: Rol está en la lista permitida (array input)', () => {
            req.userRole = 'lider';
            const middleware = checkRole(['admin', 'lider']);
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it('Denegar acceso: Rol no coincide (403)', () => {
            req.userRole = 'user';
            const middleware = checkRole('admin');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 'INSUFFICIENT_PERMISSIONS'
            }));
            expect(next).not.toHaveBeenCalled();
        });
    });

    // =================================================================
    // 2. PRUEBAS PARA isAdmin
    // =================================================================
    describe('isAdmin', () => {
        it('Permitir acceso: Es admin', () => {
            req.userRole = 'admin';
            isAdmin(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('Denegar acceso: No es admin', () => {
            req.userRole = 'user';
            isAdmin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    // =================================================================
    // 3. PRUEBAS PARA isCoordinador (Lógica Específica)
    // =================================================================
    describe('isCoordinador', () => {
        it('Permitir acceso: Es coordinador', () => {
            req.userRole = 'coordinador';
            isCoordinador(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        // Cubre líneas 65-74: Lógica específica que rechaza incluso a otros roles altos si no es 'coordinador'
        it('Denegar acceso: No es coordinador (Cubre bloque específico)', () => {
            req.userRole = 'admin'; // Tu lógica estricta rechaza 'admin' aquí también
            isCoordinador(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 'COORDINATOR_REQUIRED',
                message: expect.stringMatching(/requiere privilegios de coordinador/i)
            }));
            expect(next).not.toHaveBeenCalled();
        });
    });

    // =================================================================
    // 4. PRUEBAS PARA isLider
    // =================================================================
    describe('isLider', () => {
        // Cubre líneas 82-83
        it('Permitir acceso: Es lider', () => {
            req.userRole = 'lider';
            isLider(req, res, next); // isLider llama a checkRole internamente
            expect(next).toHaveBeenCalled();
        });

        it('Denegar acceso: No es lider', () => {
            req.userRole = 'user';
            isLider(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    // =================================================================
    // 5. PRUEBAS PARA checkMultipleRoles
    // =================================================================
    describe('checkMultipleRoles', () => {
        // Cubre líneas 92-94
        it('Permitir acceso: Tiene uno de los roles requeridos', () => {
            req.userRole = 'lider';
            const middleware = checkMultipleRoles(['admin', 'lider']);
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('Denegar acceso: No tiene ninguno de los roles', () => {
            req.userRole = 'user';
            const middleware = checkMultipleRoles(['admin', 'lider']);
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

});