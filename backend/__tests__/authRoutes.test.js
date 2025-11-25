const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Variables
let tokenUser = '';
let resetToken = '';

const userSignup = {
    document: 99988877,
    fullname: "Usuario Nuevo",
    username: "new_user_auth",
    email: "new_auth@test.com",
    password: "password123",
    role: "lider"
};

describe('Pruebas de Integración: Autenticación Completa', () => {

    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);
        await User.deleteMany({ email: userSignup.email });
    });

    afterAll(async () => {
        await User.deleteMany({ email: userSignup.email });
        await mongoose.connection.close();
        jest.restoreAllMocks(); // IMPORTANTE: Limpiar los espías al final
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Limpiar espías después de cada test individual
    });

    // --- 1. REGISTRO (SIGNUP) ---
    it('POST /api/auth/signup - Debería registrar un nuevo usuario', async () => {
        const res = await request(app).post('/api/auth/signup').send(userSignup);
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/auth/signup - Debería fallar con email duplicado (400)', async () => {
        const res = await request(app).post('/api/auth/signup').send(userSignup);
        expect(res.statusCode).not.toBe(201);
    });

    // 🔥 NUEVO: Forzar error 500 en Signup
    it('POST /api/auth/signup - Debería dar 500 si la DB falla al guardar', async () => {
        // Saboteamos el método .save() del prototipo de User
        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => {
            throw new Error('Error forzado de base de datos');
        });

        const userFail = { ...userSignup, username: "fail_db", email: "fail@db.com", document: 123123 };
        const res = await request(app).post('/api/auth/signup').send(userFail);

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toMatch(/error al registrar/i);
    });

    // --- 2. LOGIN (SIGNIN) ---
    it('POST /api/auth/signin - Debería loguear al usuario creado', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: userSignup.email,
            password: userSignup.password
        });
        expect(res.statusCode).toBe(200);
        tokenUser = res.body.token;
    });

    it('POST /api/auth/signin - Debería dar 404 si usuario no existe', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: "noexiste@test.com",
            password: "123"
        });
        expect(res.statusCode).toBe(404);
    });

    it('POST /api/auth/signin - Debería dar 401 si contraseña es incorrecta', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: userSignup.email,
            password: "wrongpassword"
        });
        expect(res.statusCode).toBe(401);
    });

    // 🔥 NUEVO: Forzar error 500 en Signin
    it('POST /api/auth/signin - Debería dar 500 si la DB falla al buscar', async () => {
        // Saboteamos User.findOne
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
            throw new Error('Error forzado de DB');
        });

        const res = await request(app).post('/api/auth/signin').send({
            email: userSignup.email,
            password: userSignup.password
        });

        expect(res.statusCode).toBe(500);
    });

    // --- 3. RECUPERACIÓN (FORGOT/RESET) ---
    it('POST /api/auth/forgot-password - Generar token', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({ email: userSignup.email });
        expect(res.statusCode).toBe(200);
        resetToken = res.body.token;
    });

    // 🔥 NUEVO: Forzar error 500 en Forgot Password
    it('POST /api/auth/forgot-password - Debería dar 500 si la DB falla', async () => {
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
            throw new Error('Error forzado');
        });
        const res = await request(app).post('/api/auth/forgot-password').send({ email: userSignup.email });
        expect(res.statusCode).toBe(500);
    });

    it('POST /api/auth/reset-password - Resetear clave', async () => {
        const res = await request(app).post('/api/auth/reset-password').send({
            token: resetToken,
            newPassword: "newPassword123"
        });
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/auth/reset-password - Error con token inválido', async () => {
        const res = await request(app).post('/api/auth/reset-password').send({
            token: "token_invalido",
            newPassword: "abc"
        });
        expect(res.statusCode).toBe(400);
    });

    // 🔥 NUEVO: Forzar error 500 en Reset Password (simulando fallo al guardar)
    it('POST /api/auth/reset-password - Debería dar 500 si falla al guardar nueva clave', async () => {
        // Para llegar al save(), primero debe pasar el verify y el findById
        // Generamos un token válido para pasar la primera barrera
        const tokenMock = jwt.sign({ id: 'fake_id', action: 'password_reset', email: 'test@test.com' }, 'test_secret');
        
        // Mockeamos jwt.verify para que acepte el token sin config real
        jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'fake_id', action: 'password_reset', email: 'test@test.com' });
        
        // Mockeamos findById para devolver un usuario dummy que podamos "guardar"
        const mockUser = {
            email: 'test@test.com',
            save: jest.fn().mockRejectedValue(new Error('Error al guardar clave')) // Aquí forzamos el error
        };
        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

        const res = await request(app).post('/api/auth/reset-password').send({
            token: tokenMock,
            newPassword: "abc"
        });

        expect(res.statusCode).toBe(500);
    });

    // --- 4. CAMBIO DE CONTRASEÑA (LOGUEADO) ---
    it('POST /api/auth/signin - Relogin con nueva clave', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: userSignup.email, password: "newPassword123"
        });
        tokenUser = res.body.token;
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/auth/change-password - Cambiar clave', async () => {
        const res = await request(app)
            .post('/api/auth/change-password')
            .set('x-access-token', tokenUser)
            .send({
                currentPassword: "newPassword123",
                newPassword: "finalPassword123"
            });
        expect(res.statusCode).toBe(200);
    });

    // 🔥 NUEVO: Forzar error 500 en Change Password
    it('POST /api/auth/change-password - Error 500 al buscar usuario', async () => {
        jest.spyOn(User, 'findById').mockImplementationOnce(() => {
            throw new Error('Error DB');
        });
        
        const res = await request(app)
            .post('/api/auth/change-password')
            .set('x-access-token', tokenUser)
            .send({ currentPassword: "x", newPassword: "y" });

        expect(res.statusCode).toBe(500);
    });

});