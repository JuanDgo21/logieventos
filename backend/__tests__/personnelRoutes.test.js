const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Personnel = require('../models/Personnel');
const PersonnelType = require('../models/PersonnelType');
// Importamos Contract para que Mongoose lo registre (necesario para el controlador de delete)
try { require('../models/Contract'); } catch (e) {}

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let personnelTypeId = ''; // ID real del tipo de personal
let personnelId = '';     // ID del personal creado

// 1. Datos Admin
const adminUser = {
    document: 77777777,
    fullname: "Admin Personnel",
    username: "admin_pers",
    email: "admin_p@test.com",
    password: "password123",
    role: "admin"
};

// 2. Datos Coordinador
const coordUser = {
    document: 88888888,
    fullname: "Coord Personnel",
    username: "coord_pers",
    email: "coord_p@test.com",
    password: "password123",
    role: "coordinador"
};

// 3. Objeto de Prueba (Personal)
const personnelPrueba = {
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan.perez@test.com",
    phone: "3001234567",
    skills: ["Servicio al cliente", "Inglés básico"]
    // personnelType se asignará dinámicamente en el test
};

describe('Pruebas de Integración: Gestión de Personal', () => {

    // --- CONFIGURACIÓN INICIAL ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // 1. Limpieza total
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Personnel.deleteMany({ email: personnelPrueba.email });
        await PersonnelType.deleteMany({ name: "Tipo Test Para Personal" });

        // 2. Crear índices (Importante para unique: true del email)
        await Personnel.createIndexes();

        // 3. Crear Usuarios
        await new User(adminUser).save();
        await new User(coordUser).save();

        // 4. CREAR UN TIPO DE PERSONAL REAL (Dependencia)
        // Necesitamos esto porque tu controlador valida que el tipo exista
        const tipo = await new PersonnelType({
            name: "Tipo Test Para Personal",
            description: "Creado para testing de personal",
            rate: 20000, // Aunque tu modelo no lo tenga, el controlador lo espera
            createdBy: new mongoose.Types.ObjectId() // Fake ID para cumplir el required
        }).save();
        personnelTypeId = tipo._id;
    });

    // --- LIMPIEZA FINAL ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Personnel.deleteMany({ email: personnelPrueba.email });
        await PersonnelType.deleteMany({ _id: personnelTypeId });
        await mongoose.connection.close();
    });

    // --- LOGIN ---
    it('Debería loguearse y obtener tokens', async () => {
        const resAdmin = await request(app).post('/api/auth/signin').send({
            email: adminUser.email, password: adminUser.password
        });
        tokenAdmin = resAdmin.body.token;

        const resCoord = await request(app).post('/api/auth/signin').send({
            email: coordUser.email, password: coordUser.password
        });
        tokenCoordinador = resCoord.body.token;

        expect(resAdmin.statusCode).toBe(200);
        expect(resCoord.statusCode).toBe(200);
    });

    // --- CREATE (POST) ---
    it('POST /api/personnel - Debería fallar si el Tipo de Personal no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .post('/api/personnel')
            .set('x-access-token', tokenAdmin)
            .send({ ...personnelPrueba, personnelType: fakeId });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/no existe/i);
    });

    it('POST /api/personnel - Admin crea Personal correctamente', async () => {
        const res = await request(app)
            .post('/api/personnel')
            .set('x-access-token', tokenAdmin)
            .send({ ...personnelPrueba, personnelType: personnelTypeId });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(personnelPrueba.email);
        
        personnelId = res.body.data._id;
    });

    it('POST /api/personnel - Error al duplicar email', async () => {
        const res = await request(app)
            .post('/api/personnel')
            .set('x-access-token', tokenAdmin)
            .send({ ...personnelPrueba, personnelType: personnelTypeId });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // --- READ (GET) ---
    it('GET /api/personnel - Listar todo el personal', async () => {
        const res = await request(app)
            .get('/api/personnel')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        const existe = res.body.data.some(p => p._id === personnelId);
        expect(existe).toBe(true);
    });

    // --- UPDATE (PUT) ---
    it('PUT /api/personnel/:id - Coordinador actualiza teléfono', async () => {
        const nuevoTel = "3009999999";
        const res = await request(app)
            .put(`/api/personnel/${personnelId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ phone: nuevoTel });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.phone).toBe(nuevoTel);
    });

    it('PUT /api/personnel/:id - Coordinador NO puede cambiar status', async () => {
        const res = await request(app)
            .put(`/api/personnel/${personnelId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ status: 'inactivo' });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/no pueden cambiar el estado/i);
    });

    // --- DELETE (DELETE) ---
    it('DELETE /api/personnel/:id - Admin elimina el registro', async () => {
        const res = await request(app)
            .delete(`/api/personnel/${personnelId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/personnel/:id - Debería dar 404 al buscar de nuevo', async () => {
        const res = await request(app)
            .get(`/api/personnel/${personnelId}`)
            .set('x-access-token', tokenAdmin);
            
        expect(res.statusCode).toBe(404);
    });

});