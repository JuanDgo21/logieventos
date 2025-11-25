const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const ProviderType = require('../models/ProviderType');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let providerTypeId = ''; // Para guardar el ID del tipo creado

// 1. Datos Admin
const adminUser = {
    document: 11111111,
    fullname: "Admin ProviderType",
    username: "admin_prov_type",
    email: "admin_prov@test.com",
    password: "password123", // Se encriptará automáticamente por el modelo
    role: "admin"
};

// 2. Datos Coordinador
const coordUser = {
    document: 22222222,
    fullname: "Coord ProviderType",
    username: "coord_prov_type",
    email: "coord_prov@test.com",
    password: "password123",
    role: "coordinador"
};

// 3. Objeto de Prueba
const providerTypePrueba = {
    name: "Catering Gourmet",
    description: "Proveedores de comida de alta gama",
    isActive: true
};

describe('Pruebas de Integración: Tipos de Proveedor', () => {

    // --- CONFIGURACIÓN PREVIA (SETUP) ---
    beforeAll(async () => {
        // Conexión DB Test
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // Limpieza total
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await ProviderType.deleteMany({ name: providerTypePrueba.name });

        // Crear usuarios (Sin hash manual, confiamos en User.js)
        await new User(adminUser).save();
        await new User(coordUser).save();
    });

    // --- LIMPIEZA FINAL (TEARDOWN) ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await ProviderType.deleteMany({ name: providerTypePrueba.name });
        await mongoose.connection.close();
    });

    // --- PASO 1: LOGIN ---
    it('Debería loguearse y obtener tokens para Admin y Coordinador', async () => {
        // Login Admin
        const resAdmin = await request(app).post('/api/auth/signin').send({
            email: adminUser.email,
            password: adminUser.password
        });
        expect(resAdmin.statusCode).toBe(200);
        tokenAdmin = resAdmin.body.token;

        // Login Coordinador
        const resCoord = await request(app).post('/api/auth/signin').send({
            email: coordUser.email,
            password: coordUser.password
        });
        expect(resCoord.statusCode).toBe(200);
        tokenCoordinador = resCoord.body.token;
    });

    // --- PASO 2: CREAR (POST) ---
    it('POST /api/provider-types - Admin crea un Tipo de Proveedor', async () => {
        const res = await request(app)
            .post('/api/provider-types')
            .set('x-access-token', tokenAdmin)
            .send(providerTypePrueba);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(providerTypePrueba.name);
        
        // Guardar ID para siguientes pruebas
        providerTypeId = res.body.data._id;
    });

    it('POST /api/provider-types - Debería fallar con nombre duplicado', async () => {
        const res = await request(app)
            .post('/api/provider-types')
            .set('x-access-token', tokenAdmin)
            .send(providerTypePrueba);

        // Tu controlador devuelve 400 cuando es duplicado (code 11000)
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // --- PASO 3: LEER (GET) ---
    it('GET /api/provider-types - Coordinador lista los tipos', async () => {
        const res = await request(app)
            .get('/api/provider-types')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        // Verificar que el creado existe en la lista
        const existe = res.body.data.some(p => p._id === providerTypeId);
        expect(existe).toBe(true);
    });

    it('GET /api/provider-types/:id - Obtener detalle por ID', async () => {
        const res = await request(app)
            .get(`/api/provider-types/${providerTypeId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.description).toBe(providerTypePrueba.description);
    });

    // --- PASO 4: ACTUALIZAR (PUT) ---
    it('PUT /api/provider-types/:id - Coordinador actualiza descripción (Permitido)', async () => {
        const nuevaDesc = "Descripción editada por Coordinador";
        
        const res = await request(app)
            .put(`/api/provider-types/${providerTypeId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ description: nuevaDesc });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.description).toBe(nuevaDesc);
    });

    it('PUT /api/provider-types/:id - Coordinador intenta cambiar "isActive" (PROHIBIDO)', async () => {
        const res = await request(app)
            .put(`/api/provider-types/${providerTypeId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ isActive: false });

        // Tu controlador devuelve 403 Forbidden
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/no pueden cambiar el estado/i);
    });

    // --- PASO 5: ELIMINAR (DELETE) ---
    it('DELETE /api/provider-types/:id - Admin elimina el registro', async () => {
        const res = await request(app)
            .delete(`/api/provider-types/${providerTypeId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/provider-types/:id - Debería dar 404 al buscarlo de nuevo', async () => {
        const res = await request(app)
            .get(`/api/provider-types/${providerTypeId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(404);
    });

});