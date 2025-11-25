const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let tokenLider = '';

let adminId = '';
let liderId = ''; 

// 1. Datos de Usuarios Base 
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
        const testDB = 'mongodb://localhost:27017/logieventos_test';
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
        jest.restoreAllMocks(); // Limpiar espías al final
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Limpiar espías entre tests
    });

    // --- LOGIN ---
    it('Debería loguearse con los 3 roles', async () => {
        const resAdmin = await request(app).post('/api/auth/signin').send({
            email: adminUser.email, password: adminUser.password
        });
        tokenAdmin = resAdmin.body.token;

        const resCoord = await request(app).post('/api/auth/signin').send({
            email: coordUser.email, password: coordUser.password
        });
        tokenCoordinador = resCoord.body.token;

        const resLider = await request(app).post('/api/auth/signin').send({
            email: liderUser.email, password: liderUser.password
        });
        tokenLider = resLider.body.token;

        expect(resAdmin.statusCode).toBe(200);
    });

    // --- PRUEBAS NORMALES (HAPPY PATH & LOGIC ERRORS) ---

    it('POST /api/users - Admin crea un nuevo usuario Lider', async () => {
        const newUser = {
            document: 40404040,
            fullname: "Nuevo Lider",
            username: "new_lider",
            email: "new@test.com",
            password: "password123",
            role: "lider"
        };
        const res = await request(app).post('/api/users').set('x-access-token', tokenAdmin).send(newUser);
        expect(res.statusCode).toBe(201);
    });

    it('POST /api/users - Error al duplicar (400)', async () => {
        // Intentamos crear el mismo usuario
        const newUser = {
            document: 40404040,
            fullname: "Nuevo Lider",
            username: "new_lider",
            email: "new@test.com",
            password: "password123",
            role: "lider"
        };
        const res = await request(app).post('/api/users').set('x-access-token', tokenAdmin).send(newUser);
        expect(res.statusCode).toBe(400);
    });

    it('GET /api/users - Admin ve todos los usuarios', async () => {
        const res = await request(app).get('/api/users').set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    it('GET /api/users/:id - Lider ve su propio perfil', async () => {
        const res = await request(app).get(`/api/users/${liderId}`).set('x-access-token', tokenLider);
        expect(res.statusCode).toBe(200);
    });

    it('PUT /api/users/:id - Lider actualiza su propio nombre', async () => {
        const res = await request(app).put(`/api/users/${liderId}`).set('x-access-token', tokenLider).send({ fullname: "Lider Actualizado" });
        expect(res.statusCode).toBe(200);
    });

    it('DELETE /api/users/:id - Admin elimina al usuario Lider base', async () => {
        const res = await request(app).delete(`/api/users/${liderId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    // ==================================================================
    // 🔥 ZONA DE SABOTAJE: PRUEBAS DE ERROR 500 (FORZADOS)
    // ==================================================================

    it('GET /api/users - Error 500 si DB falla al listar', async () => {
        jest.spyOn(User, 'find').mockImplementationOnce(() => { throw new Error('DB Crash List'); });
        
        const res = await request(app).get('/api/users').set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('GET /api/users/:id - Error 500 si DB falla al buscar uno', async () => {
        jest.spyOn(User, 'findById').mockImplementationOnce(() => { throw new Error('DB Crash Find'); });
        
        const res = await request(app).get(`/api/users/${adminId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('POST /api/users - Error 500 si DB falla al guardar', async () => {
        // Simulamos fallo en el .save() del prototipo
        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => { throw new Error('DB Crash Save'); });
        
        const newUser = { document: 999, fullname: "X", username: "x", email: "x@x.com", password: "123", role: "lider" };
        const res = await request(app).post('/api/users').set('x-access-token', tokenAdmin).send(newUser);
        
        expect(res.statusCode).toBe(500);
    });

    it('PUT /api/users/:id - Error 500 si DB falla al actualizar', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => { throw new Error('DB Crash Update'); });
        
        const res = await request(app).put(`/api/users/${adminId}`).set('x-access-token', tokenAdmin).send({ fullname: "Test" });
        expect(res.statusCode).toBe(500);
    });

    it('DELETE /api/users/:id - Error 500 si DB falla al eliminar', async () => {
        // Usamos un ID dummy porque no queremos borrar al admin de verdad, solo probar el fallo
        const dummyId = new mongoose.Types.ObjectId();
        jest.spyOn(User, 'findByIdAndDelete').mockImplementationOnce(() => { throw new Error('DB Crash Delete'); });
        
        const res = await request(app).delete(`/api/users/${dummyId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

});