const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Provider = require('../models/Provider');
const ProviderType = require('../models/ProviderType');
// Importamos Contract para evitar errores en delete
try { require('../models/Contract'); } catch (e) {}

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let providerTypeId = ''; // ID real del tipo
let providerId = '';     // ID del proveedor creado

// 1. Datos Admin
const adminUser = {
    document: 12121212,
    fullname: "Admin Provider",
    username: "admin_prov",
    email: "admin_pr@test.com",
    password: "password123",
    role: "admin"
};

// 2. Datos Coordinador
const coordUser = {
    document: 13131313,
    fullname: "Coord Provider",
    username: "coord_prov",
    email: "coord_pr@test.com",
    password: "password123",
    role: "coordinador"
};

// 3. Objeto de Prueba
const providerPrueba = {
    name: "Empresa de Sonido S.A.S.",
    contactPerson: "Carlos Ruiz",
    email: "contacto@sonido.com",
    phone: "3105556677",
    address: "Calle 100 # 15-20"
};

describe('Pruebas de Integración: Gestión de Proveedores', () => {

    // --- SETUP ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // 1. Limpieza
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Provider.deleteMany({}); // Borramos todos para evitar choques
        await ProviderType.deleteMany({});

        // 2. Asegurar índices (Vital para unique: true)
        await Provider.createIndexes();

        // 3. Crear Usuarios
        await new User(adminUser).save();
        await new User(coordUser).save();

        // 4. Crear Dependencia (ProviderType)
        const tipo = await new ProviderType({
            name: "Tipo Test Proveedor",
            description: "Para testing",
            createdBy: new mongoose.Types.ObjectId()
        }).save();
        providerTypeId = tipo._id;
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Provider.deleteMany({ email: providerPrueba.email });
        await ProviderType.deleteMany({ _id: providerTypeId });
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
    it('POST /api/providers - Error si Tipo de Proveedor no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .post('/api/providers')
            .set('x-access-token', tokenAdmin)
            .send({ ...providerPrueba, providerType: fakeId });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/no existe/i);
    });

    it('POST /api/providers - Admin crea Proveedor correctamente', async () => {
        const res = await request(app)
            .post('/api/providers')
            .set('x-access-token', tokenAdmin)
            .send({ ...providerPrueba, providerType: providerTypeId });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(providerPrueba.email);
        
        providerId = res.body.data._id;
    });

    it('POST /api/providers - Error al duplicar email', async () => {
        // Solo pasará si agregaste unique: true al modelo
        const res = await request(app)
            .post('/api/providers')
            .set('x-access-token', tokenAdmin)
            .send({ ...providerPrueba, providerType: providerTypeId });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // --- READ (GET) ---
    it('GET /api/providers - Listar proveedores', async () => {
        const res = await request(app)
            .get('/api/providers')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        const existe = res.body.data.some(p => p._id === providerId);
        expect(existe).toBe(true);
    });

    // --- UPDATE (PUT) ---
    it('PUT /api/providers/:id - Coordinador actualiza contacto', async () => {
        const nuevoContacto = "Ana María Test";
        const res = await request(app)
            .put(`/api/providers/${providerId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ contactPerson: nuevoContacto });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.contactPerson).toBe(nuevoContacto);
    });

    it('PUT /api/providers/:id - Coordinador NO puede cambiar status', async () => {
        const res = await request(app)
            .put(`/api/providers/${providerId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ status: 'suspendido' });

        expect(res.statusCode).toBe(403);
    });

    // --- DELETE (DELETE) ---
    it('DELETE /api/providers/:id - Admin elimina el registro', async () => {
        const res = await request(app)
            .delete(`/api/providers/${providerId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/providers/:id - Confirmar eliminación', async () => {
        const res = await request(app)
            .get(`/api/providers/${providerId}`)
            .set('x-access-token', tokenAdmin);
            
        expect(res.statusCode).toBe(404);
    });

});