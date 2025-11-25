const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const ResourceType = require('../models/ResourceType');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let resourceTypeId = '';

// 1. Datos Admin
const adminUser = {
    document: 55555555,
    fullname: "Admin ResourceType",
    username: "admin_res_type",
    email: "admin_res@test.com",
    password: "password123",
    role: "admin"
};

// 2. Datos Coordinador
const coordUser = {
    document: 66666666,
    fullname: "Coord ResourceType",
    username: "coord_res_type",
    email: "coord_res@test.com",
    password: "password123",
    role: "coordinador"
};

// 3. Objeto de Prueba
const resourceTypePrueba = {
    name: "Proyector 4K",
    description: "Proyectores de alta resolución para conferencias",
    active: true
};

describe('Pruebas de Integración: Tipos de Recurso', () => {

    // --- CONFIGURACIÓN INICIAL ---
   beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // 1. Limpiar datos
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await ResourceType.deleteMany({}); // Borramos los recursos viejos

        // 2. Asegurar índices (Ahora sí funcionará porque agregaste unique: true al modelo)
        await ResourceType.createIndexes(); 

        // 3. Crear usuarios
        await new User(adminUser).save();
        await new User(coordUser).save();
    });

    // --- LIMPIEZA FINAL ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await ResourceType.deleteMany({ name: resourceTypePrueba.name });
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
    it('POST /api/resource-types - Admin crea Tipo de Recurso', async () => {
        const res = await request(app)
            .post('/api/resource-types')
            .set('x-access-token', tokenAdmin)
            .send(resourceTypePrueba);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(resourceTypePrueba.name);
        
        resourceTypeId = res.body.data._id;
    });

    it('POST /api/resource-types - Error al duplicar nombre', async () => {
        const res = await request(app)
            .post('/api/resource-types')
            .set('x-access-token', tokenAdmin)
            .send(resourceTypePrueba);

        expect(res.statusCode).toBe(400); // Requiere borrar el middleware del modelo
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // --- READ (GET) ---
    it('GET /api/resource-types - Coordinador lista todos', async () => {
        const res = await request(app)
            .get('/api/resource-types')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        const existe = res.body.data.some(r => r._id === resourceTypeId);
        expect(existe).toBe(true);
    });

    it('GET /api/resource-types/active - Listar solo activos', async () => {
        const res = await request(app)
            .get('/api/resource-types/active')
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    // --- UPDATE (PUT) ---
    it('PUT /api/resource-types/:id - Coordinador actualiza descripción', async () => {
        const nuevaDesc = "Descripción actualizada por Coordinador";
        const res = await request(app)
            .put(`/api/resource-types/${resourceTypeId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ description: nuevaDesc });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.description).toBe(nuevaDesc);
    });

    it('PUT /api/resource-types/:id - Coordinador NO puede cambiar active', async () => {
        const res = await request(app)
            .put(`/api/resource-types/${resourceTypeId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ active: false });

        // Tu controlador devuelve 403 Forbidden
        expect(res.statusCode).toBe(403);
    });

    // --- DELETE (DELETE) ---
    it('DELETE /api/resource-types/:id - Admin elimina el registro', async () => {
        const res = await request(app)
            .delete(`/api/resource-types/${resourceTypeId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/resource-types/:id - Debería dar 404 al buscar de nuevo', async () => {
        const res = await request(app)
            .get(`/api/resource-types/${resourceTypeId}`)
            .set('x-access-token', tokenAdmin);
            
        expect(res.statusCode).toBe(404);
    });

});