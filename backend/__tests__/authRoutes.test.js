const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Variables globales
let tokenUser = '';
let resetToken = '';

// Usuario principal para pruebas
const userSignup = {
    document: 99988877,
    fullname: "Usuario Nuevo",
    username: "new_user_auth",
    email: "new_auth@test.com",
    password: "password123",
    role: "lider"
};

// Usuario para prueba de Rol por Defecto (Línea 56)
const userNoRole = {
    document: 77788899,
    fullname: "User Default Role",
    username: "default_role_user",
    email: "default@test.com",
    password: "password123"
    // Sin campo 'role'
};

describe('Pruebas de Integración: Autenticación Completa', () => {

    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);
        
        // LIMPIEZA AMPLIA: Borramos ambos usuarios para evitar conflictos de Unique
        await User.deleteMany({ 
            email: { $in: [userSignup.email, userNoRole.email] } 
        });
    });

    afterAll(async () => {
        // Limpieza al finalizar
        await User.deleteMany({ 
            email: { $in: [userSignup.email, userNoRole.email] } 
        });
        await mongoose.connection.close();
        jest.restoreAllMocks(); 
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ==================================================
    // 1. REGISTRO (SIGNUP)
    // ==================================================

    it('POST /api/auth/signup - Éxito: Debería registrar usuario', async () => {
        const res = await request(app).post('/api/auth/signup').send(userSignup);
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    // ---> TEST PARA LA LÍNEA 56 (Default Role) <---
    it('POST /api/auth/signup - Éxito: Asigna rol "lider" por defecto si no se envía', async () => {
        const res = await request(app).post('/api/auth/signup').send(userNoRole);

        // Si esto falla con 400, revisa si 'default@test.com' ya existe en tu DB
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        // Verificamos que el backend haya asignado 'lider' automáticamente
        expect(res.body.user.role).toBe('lider');
    });

    it('POST /api/auth/signup - Fallo: Username solo espacios (Línea 15)', async () => {
        // Usamos email/doc diferentes para evitar choque con userSignup
        const userSpaces = { ...userSignup, username: "   ", email: "spaces@t.com", document: 111 };
        const res = await request(app).post('/api/auth/signup').send(userSpaces);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/nombre de usuario es requerido/i);
    });

    it('POST /api/auth/signup - Fallo: Documento vacío', async () => {
        const userDocEmpty = { ...userSignup, username: "doc_empty", email: "doc@e.com", document: "" };
        const res = await request(app).post('/api/auth/signup').send(userDocEmpty);
        expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/signup - Fallo: Documento no numérico', async () => {
        const userDocNaN = { ...userSignup, username: "doc_nan", email: "nan@e.com", document: "ABC" };
        const res = await request(app).post('/api/auth/signup').send(userDocNaN);
        expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/signup - Fallo: Email duplicado (Middleware)', async () => {
        const res = await request(app).post('/api/auth/signup').send(userSignup);
        expect(res.statusCode).not.toBe(201); 
    });

    it('POST /api/auth/signup - Error 400: Duplicado (Controller)', async () => {
        const errorMock = new Error('Duplicado');
        errorMock.code = 11000;
        errorMock.keyPattern = { email: 1 };
        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => { throw errorMock; });

        const userUnique = { ...userSignup, username: "u_11000", email: "u11000@t.com", document: 555 };
        const res = await request(app).post('/api/auth/signup').send(userUnique);
        
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya está en uso/i);
    });

    it('POST /api/auth/signup - Error 400: ValidationError de Mongoose', async () => {
        const errorMock = new Error('Validacion Fallida');
        errorMock.name = 'ValidationError';
        errorMock.errors = { email: { message: 'Email inválido custom message' } };

        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => { throw errorMock; });

        const userValidButFail = { ...userSignup, username: "valid_val_err", email: "valid_val@t.com", document: 777 };
        const res = await request(app).post('/api/auth/signup').send(userValidButFail);
        
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Email inválido custom message/);
    });

    it('POST /api/auth/signup - Error 500: Fallo general en DB', async () => {
        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => { throw new Error('Error forzado de base de datos'); });
        const userFail = { ...userSignup, username: "fail_db", email: "fail@db.com", document: 123123 };
        const res = await request(app).post('/api/auth/signup').send(userFail);
        expect(res.statusCode).toBe(500);
    });

    // ==================================================
    // 2. LOGIN (SIGNIN)
    // ==================================================

    it('POST /api/auth/signin - Éxito', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: userSignup.email,
            password: userSignup.password
        });
        expect(res.statusCode).toBe(200);
        tokenUser = res.body.token;
    });

    it('POST /api/auth/signin - Fallo: Faltan datos', async () => {
        const res = await request(app).post('/api/auth/signin').send({});
        expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/signin - Fallo: Usuario no encontrado', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: "noexiste@test.com",
            password: "123"
        });
        expect(res.statusCode).toBe(404);
    });

    it('POST /api/auth/signin - Fallo: Contraseña incorrecta', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: userSignup.email,
            password: "wrongpassword"
        });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/auth/signin - Error 500', async () => {
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => { throw new Error('Error forzado'); });
        const res = await request(app).post('/api/auth/signin').send({
            email: userSignup.email,
            password: userSignup.password
        });
        expect(res.statusCode).toBe(500);
    });

    // ==================================================
    // 3. RECUPERACIÓN (FORGOT/RESET)
    // ==================================================

    it('POST /api/auth/forgot-password - Éxito', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({ email: userSignup.email });
        expect(res.statusCode).toBe(200);
        resetToken = res.body.token;
    });

    it('POST /api/auth/forgot-password - Fallo: Email vacío', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({});
        expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/forgot-password - Éxito simulado (No existe)', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({ email: "fantasma@test.com" });
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/auth/forgot-password - Error 500', async () => {
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => { throw new Error('Error forzado'); });
        const res = await request(app).post('/api/auth/forgot-password').send({ email: userSignup.email });
        expect(res.statusCode).toBe(500);
    });

    it('POST /api/auth/reset-password - Fallo: Faltan datos', async () => {
        const res = await request(app).post('/api/auth/reset-password').send({});
        expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/reset-password - Fallo: Token inválido', async () => {
        const res = await request(app).post('/api/auth/reset-password').send({ token: "bad", newPassword: "abc" });
        expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/reset-password - Fallo: Token válido pero acción incorrecta', async () => {
        jest.spyOn(jwt, 'verify').mockReturnValue({ id: '123', action: 'wrong_action', email: 't@t.com' });
        const res = await request(app).post('/api/auth/reset-password').send({ token: "valid_bad_action", newPassword: "abc" });
        expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/reset-password - Fallo: Token válido pero usuario no encontrado', async () => {
        jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'fake_id', action: 'password_reset', email: 'x@x.com' });
        jest.spyOn(User, 'findById').mockResolvedValue(null);
        const res = await request(app).post('/api/auth/reset-password').send({ token: "fake", newPassword: "123" });
        expect(res.statusCode).toBe(404);
    });

    it('POST /api/auth/reset-password - Fallo: Token no coincide con usuario', async () => {
        jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'fake_id', action: 'password_reset', email: 'otro@x.com' });
        jest.spyOn(User, 'findById').mockResolvedValue({ email: 'original@x.com' });
        const res = await request(app).post('/api/auth/reset-password').send({ token: "fake", newPassword: "123" });
        expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/reset-password - Éxito', async () => {
        const res = await request(app).post('/api/auth/reset-password').send({ token: resetToken, newPassword: "newPassword123" });
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/auth/reset-password - Error 500', async () => {
        const tokenMock = jwt.sign({ id: 'fake', action: 'password_reset', email: 't@t.com' }, 's');
        jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'fake', action: 'password_reset', email: 't@t.com' });
        const mockUser = { email: 't@t.com', save: jest.fn().mockRejectedValue(new Error('Error')) };
        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        const res = await request(app).post('/api/auth/reset-password').send({ token: tokenMock, newPassword: "abc" });
        expect(res.statusCode).toBe(500);
    });

    // ==================================================
    // 4. CAMBIO DE CONTRASEÑA
    // ==================================================

    it('POST /api/auth/signin - Relogin', async () => {
        const res = await request(app).post('/api/auth/signin').send({ email: userSignup.email, password: "newPassword123" });
        tokenUser = res.body.token;
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/auth/change-password - Éxito', async () => {
        const res = await request(app).post('/api/auth/change-password').set('x-access-token', tokenUser).send({
            currentPassword: "newPassword123", newPassword: "finalPassword123"
        });
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/auth/change-password - Fallo: User not found', async () => {
        jest.spyOn(User, 'findById').mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        const res = await request(app).post('/api/auth/change-password').set('x-access-token', tokenUser).send({});
        expect(res.statusCode).toBe(404);
    });

    it('POST /api/auth/change-password - Fallo: Contraseña incorrecta', async () => {
        jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false); 
        jest.spyOn(User, 'findById').mockReturnValue({ 
            select: jest.fn().mockResolvedValue({ password: "hashed_pwd" }) 
        });

        const res = await request(app).post('/api/auth/change-password').set('x-access-token', tokenUser).send({ currentPassword: "any", newPassword: "abc" });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/auth/change-password - Error 500', async () => {
        jest.spyOn(User, 'findById').mockImplementationOnce(() => { throw new Error('Error DB'); });
        const res = await request(app).post('/api/auth/change-password').set('x-access-token', tokenUser).send({});
        expect(res.statusCode).toBe(500);
    });

});