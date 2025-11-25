const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Resource = require('../models/Resource');
const ResourceType = require('../models/ResourceType');
try { require('../models/Contract'); } catch (e) {}

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let resourceTypeId = ''; 
let resourceId = '';

// 1. Datos Admin
const adminUser = {
    document: 14141414,
    fullname: "Admin Resource",
    username: "admin_res",
    email: "admin_r@test.com",
    password: "password123",
    role: "admin"
};

// 2. Datos Coordinador
const coordUser = {
    document: 15151515,
    fullname: "Coord Resource",
    username: "coord_res",
    email: "coord_r@test.com",
    password: "password123",
    role: "coordinador"
};

// 3. Objeto de Prueba
const resourcePrueba = {
    name: "Silla Tiffany Dorada",
    description: "Silla elegante para bodas",
    quantity: 100,
    cost: 5000,
    status: "disponible"
};

describe('Pruebas de Integración: Gestión de Recursos', () => {

    // --- SETUP ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // 1. Limpieza
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Resource.deleteMany({});
        await ResourceType.deleteMany({});

        // 2. Asegurar índices
        await Resource.createIndexes();

        // 3. Crear Usuarios
        await new User(adminUser).save();
        await new User(coordUser).save();

        // 4. Crear Dependencia (ResourceType)
        const tipo = await new ResourceType({
            name: "Mobiliario Test",
            description: "Muebles para eventos",
            createdBy: new mongoose.Types.ObjectId()
        }).save();
        resourceTypeId = tipo._id;
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Resource.deleteMany({ name: resourcePrueba.name });
        await ResourceType.deleteMany({ _id: resourceTypeId });
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
    });

    // --- CREATE (POST) ---
    it('POST /api/resources - Error si Tipo de Recurso no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .post('/api/resources')
            .set('x-access-token', tokenAdmin)
            .send({ ...resourcePrueba, resourceType: fakeId });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/no existe/i);
    });

    it('POST /api/resources - Admin crea Recurso correctamente', async () => {
        const res = await request(app)
            .post('/api/resources')
            .set('x-access-token', tokenAdmin)
            .send({ ...resourcePrueba, resourceType: resourceTypeId });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(resourcePrueba.name);
        
        resourceId = res.body.data._id;
    });

    it('POST /api/resources - Error al duplicar nombre', async () => {
        // Solo pasará si agregaste unique: true al modelo y borraste el middleware
        const res = await request(app)
            .post('/api/resources')
            .set('x-access-token', tokenAdmin)
            .send({ ...resourcePrueba, resourceType: resourceTypeId });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // --- READ (GET) ---
    it('GET /api/resources - Listar con paginación', async () => {
        const res = await request(app)
            .get('/api/resources?page=1&limit=5')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body).toHaveProperty('totalPages');
    });

    it('GET /api/resources/search - Buscar por nombre', async () => {
        const res = await request(app)
            .get('/api/resources/search?query=Silla')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].name).toContain('Silla');
    });

    // --- UPDATE (PUT) ---
    it('PUT /api/resources/:id - Coordinador actualiza cantidad', async () => {
        const nuevaCant = 150;
        const res = await request(app)
            .put(`/api/resources/${resourceId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ quantity: nuevaCant });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.quantity).toBe(nuevaCant);
    });

    it('PUT /api/resources/:id - Coordinador NO puede cambiar status', async () => {
        const res = await request(app)
            .put(`/api/resources/${resourceId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ status: 'mantenimiento' });

        expect(res.statusCode).toBe(403);
    });

    // --- DELETE (DELETE) ---
    it('DELETE /api/resources/:id - Admin elimina el registro', async () => {
        const res = await request(app)
            .delete(`/api/resources/${resourceId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/resources/:id - Confirmar eliminación', async () => {
        const res = await request(app)
            .get(`/api/resources/${resourceId}`)
            .set('x-access-token', tokenAdmin);
            
        expect(res.statusCode).toBe(404);
    });

});