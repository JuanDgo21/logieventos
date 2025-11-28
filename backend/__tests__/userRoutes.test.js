const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

// Importamos el controlador para pruebas unitarias de casos especiales
const userController = require('../controllers/userControllers');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let tokenLider = '';

let adminId = '';
let liderId = '';

// 1. Datos de Usuarios Permitidos
const adminUser = {
    document: 10101010,
    fullname: "Super Admin",
    username: "super_admin",
    email: "super@test.com",
    password: "password123",
    role: "admin"
};

const coordUser = {
    document: 20202020,
    fullname: "Super Coord",
    username: "super_coord",
    email: "coord@test.com",
    password: "password123",
    role: "coordinador"
};

const liderUser = {
    document: 30303030,
    fullname: "Super Lider",
    username: "super_lider",
    email: "lider@test.com",
    password: "password123",
    role: "lider"
};

describe('Pruebas de Integración: Gestión de Usuarios (CRUD)', () => {

    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test_users_final';
        await mongoose.connect(testDB);
        await User.deleteMany({});
        
        const admin = await new User(adminUser).save();
        const coord = await new User(coordUser).save();
        const lider = await new User(liderUser).save();

        adminId = admin._id;
        liderId = lider._id;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- LOGIN ---
    it('Debería loguearse con roles válidos', async () => {
        const login = async (user) => {
            const res = await request(app).post('/api/auth/signin').send({
                email: user.email, password: user.password
            });
            return res.body.token;
        };

        tokenAdmin = await login(adminUser);
        tokenCoordinador = await login(coordUser);
        tokenLider = await login(liderUser);

        expect(tokenAdmin).toBeDefined();
    });

    // ==================================================================
    // 1. GET ALL USERS
    // ==================================================================
    describe('GET /api/users', () => {
        it('Admin ve todos los usuarios', async () => {
            const res = await request(app).get('/api/users').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThanOrEqual(3);
        });

        it('Coordinador ve usuarios pero NO admins', async () => {
            const res = await request(app).get('/api/users').set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(200);
            const admins = res.body.data.filter(u => u.role === 'admin');
            expect(admins.length).toBe(0);
        });

        // --- PRUEBA UNITARIA PARA ROL 'AUXILIAR' ---
        it('Unitario: Rol "auxiliar" solo se ve a sí mismo', async () => {
            const req = { userRole: 'auxiliar', userId: '12345' };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            const mockSelect = jest.fn().mockResolvedValue([{ _id: '12345', role: 'auxiliar' }]);
            const mockFind = jest.spyOn(User, 'find').mockReturnValue({
                select: mockSelect
            });

            await userController.getAllUsers(req, res);

            expect(mockFind).toHaveBeenCalledWith({ _id: '12345' });
            expect(res.status).toHaveBeenCalledWith(200);
            mockFind.mockRestore();
        });

        it('Error 500: Fallo DB al listar', async () => {
            const mockFind = jest.spyOn(User, 'find').mockImplementationOnce(() => {
                throw new Error('DB Crash List');
            });
            const res = await request(app).get('/api/users').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            mockFind.mockRestore();
        });
    });

    // ==================================================================
    // 2. GET USER BY ID
    // ==================================================================
    describe('GET /api/users/:id', () => {
        it('Lider ve su propio perfil', async () => {
            const res = await request(app).get(`/api/users/${liderId}`).set('x-access-token', tokenLider);
            expect(res.statusCode).toBe(200);
        });

        it('Error 403: Lider intenta ver otro perfil', async () => {
            const res = await request(app).get(`/api/users/${adminId}`).set('x-access-token', tokenLider);
            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/solo puedes ver tu propio perfil/i);
        });

        it('Error 403: Coordinador intenta ver perfil de Admin', async () => {
            const res = await request(app).get(`/api/users/${adminId}`).set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/no puedes ver usuarios admin/i);
        });

        it('Error 404: Usuario no encontrado', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/users/${fakeId}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        // ✅ CORRECCIÓN APLICADA AQUÍ: Mockeamos el encadenamiento .select()
        it('Error 500: Fallo DB al buscar', async () => {
            const mockFind = jest.spyOn(User, 'findById').mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('DB Crash Find'))
            });
            
            const res = await request(app).get(`/api/users/${adminId}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            mockFind.mockRestore();
        });
    });

    // ==================================================================
    // 3. CREATE USER
    // ==================================================================
    describe('POST /api/users', () => {
        const newUser = {
            document: 50505050,
            fullname: "New User",
            username: "new_user",
            email: "new@test.com",
            password: "password123",
            role: "lider"
        };

        it('Admin crea usuario exitosamente', async () => {
            const res = await request(app).post('/api/users').set('x-access-token', tokenAdmin).send(newUser);
            expect(res.statusCode).toBe(201);
        });

        it('Error 403: Lider intenta crear usuario', async () => {
            const res = await request(app).post('/api/users').set('x-access-token', tokenLider).send(newUser);
            expect(res.statusCode).toBe(403);
        });

        it('Error 400: Rol inválido', async () => {
            const res = await request(app).post('/api/users').set('x-access-token', tokenAdmin).send({
                ...newUser, email: 'valid@test.com', username: 'valid_user', document: 515151, role: 'super_dios' 
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Rol no válido');
        });

        it('Error 403: Coordinador intenta crear Admin', async () => {
            const res = await request(app).post('/api/users').set('x-access-token', tokenCoordinador).send({
                ...newUser, email: 'admin_fake@test.com', username: 'admin_fake', role: 'admin'
            });
            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/no puedes crear usuarios con rol de admin/i);
        });

        it('Error 400: Usuario duplicado', async () => {
            const res = await request(app).post('/api/users').set('x-access-token', tokenAdmin).send(newUser);
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/ya está en uso/i);
        });

        it('Error 500: Fallo DB al guardar', async () => {
            const mockSave = jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('DB Crash Save'));
            const res = await request(app).post('/api/users').set('x-access-token', tokenAdmin).send({ 
                ...newUser, email: 'err500@test.com', username: 'err500', document: 999 
            });
            expect(res.statusCode).toBe(500);
            mockSave.mockRestore();
        });
    });

    // ==================================================================
    // 4. UPDATE USER
    // ==================================================================
    describe('PUT /api/users/:id', () => {
        it('Lider actualiza su propio perfil (password y active)', async () => {
            const res = await request(app).put(`/api/users/${liderId}`)
                .set('x-access-token', tokenLider)
                .send({ fullname: "Lider Updated", password: "newpass", active: false });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.data.fullname).toBe("Lider Updated");
        });

        it('Error 403: Lider intenta actualizar otro perfil', async () => {
            const res = await request(app).put(`/api/users/${adminId}`)
                .set('x-access-token', tokenLider)
                .send({ fullname: "Hacker" });
            expect(res.statusCode).toBe(403);
        });

        it('Error 403: Coordinador intenta actualizar Admin', async () => {
            const res = await request(app).put(`/api/users/${adminId}`)
                .set('x-access-token', tokenCoordinador)
                .send({ fullname: "Sabotaje" });
            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/no puedes actualizar usuarios admin/i);
        });

        it('Error 403: Coordinador intenta cambiar rol', async () => {
            const res = await request(app).put(`/api/users/${liderId}`)
                .set('x-access-token', tokenCoordinador)
                .send({ role: "admin" });
            
            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/solo administradores pueden cambiar roles/i);
        });

        it('Admin cambia rol exitosamente', async () => {
            const res = await request(app).put(`/api/users/${liderId}`)
                .set('x-access-token', tokenAdmin)
                .send({ role: "coordinador" });
            expect(res.statusCode).toBe(200);
            expect(res.body.data.role).toBe("coordinador");
        });

        it('Error 404: Usuario a actualizar no existe', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).put(`/api/users/${fakeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ fullname: "Fantasma" });
            expect(res.statusCode).toBe(404);
        });

        it('Error 400: Duplicado en update (ej. email)', async () => {
            const res = await request(app).put(`/api/users/${liderId}`)
                .set('x-access-token', tokenAdmin)
                .send({ email: adminUser.email });
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/ya está en uso/i);
        });

        it('Error 500: Fallo DB al actualizar', async () => {
            const mockUpdate = jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('DB Crash Update'))
            });

            const res = await request(app).put(`/api/users/${liderId}`)
                .set('x-access-token', tokenAdmin)
                .send({ fullname: "Error" });
            
            expect(res.statusCode).toBe(500);
            mockUpdate.mockRestore();
        });
    });

    // ==================================================================
    // 5. DELETE USER
    // ==================================================================
    describe('DELETE /api/users/:id', () => {
        it('Error 403: No admin intenta eliminar', async () => {
            const res = await request(app).delete(`/api/users/${liderId}`).set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(403);
        });

        it('Error 400: Admin intenta auto-eliminarse', async () => {
            const res = await request(app).delete(`/api/users/${adminId}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(400);
        });

        it('Admin elimina usuario exitosamente', async () => {
            const res = await request(app).delete(`/api/users/${liderId}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        it('Error 404: Eliminar no existente', async () => {
            const res = await request(app).delete(`/api/users/${liderId}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        it('Error 500: Fallo DB al eliminar', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const mockDel = jest.spyOn(User, 'findByIdAndDelete').mockRejectedValueOnce(new Error('DB Crash Delete'));
            const res = await request(app).delete(`/api/users/${fakeId}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            mockDel.mockRestore();
        });
    });

});