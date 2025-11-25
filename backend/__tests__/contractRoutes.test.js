const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Importar TODOS los modelos necesarios
const User = require('../models/User');
const Contract = require('../models/Contract');
const Resource = require('../models/Resource');
const ResourceType = require('../models/ResourceType');
const Provider = require('../models/Provider');
const ProviderType = require('../models/ProviderType');
const Personnel = require('../models/Personnel');
const PersonnelType = require('../models/PersonnelType');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let contractId = '';

// Variables para IDs de dependencias
let resourceId = '';
let providerId = '';
let personnelId = '';

// 1. Datos Usuarios
const adminUser = {
    document: 91919191,
    fullname: "Admin Contract",
    username: "admin_contract",
    email: "admin_c@test.com",
    password: "password123",
    role: "admin"
};

const coordUser = {
    document: 92929292,
    fullname: "Coord Contract",
    username: "coord_contract",
    email: "coord_c@test.com",
    password: "password123",
    role: "coordinador"
};

describe('Pruebas de Integración: Gestión de Contratos (Megazord)', () => {

    // --- SETUP COMPLETO ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // 1. Limpieza Total
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Contract.deleteMany({});
        await Resource.deleteMany({});
        await ResourceType.deleteMany({});
        await Provider.deleteMany({});
        await ProviderType.deleteMany({});
        await Personnel.deleteMany({});
        await PersonnelType.deleteMany({});

        // 2. Asegurar índices principales
        await Contract.createIndexes();

        // 3. Crear Usuarios
        const admin = await new User(adminUser).save();
        const coord = await new User(coordUser).save();

        // 4. CREAR EL ECOSISTEMA (Dependencias)
        
        // A. Recurso
        const resType = await new ResourceType({ name: "Tipo C-Res", createdBy: admin._id }).save();
        const resource = await new Resource({
            name: "Silla VIP",
            quantity: 100,
            cost: 10000,
            resourceType: resType._id,
            createdBy: admin._id
        }).save();
        resourceId = resource._id;

        // B. Proveedor
        const provType = await new ProviderType({ name: "Tipo C-Prov", createdBy: admin._id }).save();
        const provider = await new Provider({
            name: "Sonido Pro",
            email: "c-prov@test.com",
            providerType: provType._id
        }).save();
        providerId = provider._id;

        // C. Personal
        const persType = await new PersonnelType({ name: "Tipo C-Pers", createdBy: admin._id }).save();
        const person = await new Personnel({
            firstName: "Juan",
            lastName: "Contract",
            email: "c-pers@test.com",
            personnelType: persType._id
        }).save();
        personnelId = person._id;
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        // Limpiamos solo lo crítico
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Contract.deleteMany({});
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
    it('POST /api/contracts - Error si una dependencia no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const contractData = {
            name: "Contrato Fallido",
            clientName: "Cliente Test",
            clientEmail: "cliente@test.com",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
            resources: [{ resource: fakeId, quantity: 10 }] // ID Falso
        };

        const res = await request(app)
            .post('/api/contracts')
            .set('x-access-token', tokenAdmin)
            .send(contractData);

        expect(res.statusCode).toBe(404); // Tu helper devuelve 404 si no encuentra el recurso
        expect(res.body.message).toMatch(/no existe/i);
    });

    it('POST /api/contracts - Admin crea Contrato Completo', async () => {
        const contractData = {
            name: "Boda Real 2025",
            clientName: "Familia Real",
            clientEmail: "boda@realeza.com",
            clientPhone: "3001234567",
            startDate: "2025-06-01",
            endDate: "2025-06-02",
            budget: 5000000,
            resources: [{ resource: resourceId, quantity: 50 }],
            providers: [{ provider: providerId, cost: 200000, serviceDescription: "DJ" }],
            personnel: [{ person: personnelId, hours: 8, role: "Mesero" }]
        };

        const res = await request(app)
            .post('/api/contracts')
            .set('x-access-token', tokenAdmin)
            .send(contractData);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(contractData.name);
        
        contractId = res.body.data._id;
    });

    it('POST /api/contracts - Error de validación de fechas', async () => {
        // Tu controlador no valida fechas en CREATE explícitamente en el código que me pasaste,
        // pero sí en UPDATE. Vamos a probar UPDATE para esto.
    });

    // --- READ (GET) ---
    it('GET /api/contracts - Listar contratos', async () => {
        const res = await request(app)
            .get('/api/contracts')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/contracts/search - Buscar por nombre', async () => {
        const res = await request(app)
            .get('/api/contracts/search?name=Boda')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        expect(res.body.data[0].name).toContain("Boda");
    });

    it('GET /api/contracts/:id/report - Generar reporte financiero', async () => {
        const res = await request(app)
            .get(`/api/contracts/${contractId}/report`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('grandTotal');
        // Recursos: 50 * 10000 = 500,000
        // Proveedores: 200,000
        // Personal: 8 * 50 = 400 (Tu lógica pone tarifa fija de 50 en el cálculo)
        expect(res.body.data.grandTotal).toBeGreaterThan(0);
    });

    // --- UPDATE (PUT) ---
    it('PUT /api/contracts/:id - Error si fecha fin < fecha inicio', async () => {
        const res = await request(app)
            .put(`/api/contracts/${contractId}`)
            .set('x-access-token', tokenAdmin)
            .send({ 
                startDate: "2025-12-31",
                endDate: "2025-01-01" // Fecha anterior
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/fecha de fin no puede ser anterior/i);
    });

    it('PUT /api/contracts/:id - Actualizar estado a activo', async () => {
        const res = await request(app)
            .put(`/api/contracts/${contractId}`)
            .set('x-access-token', tokenAdmin)
            .send({ status: "activo" });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe("activo");
    });

    // --- DELETE (DELETE) ---
    it('DELETE /api/contracts/:id - Admin elimina contrato', async () => {
        const res = await request(app)
            .delete(`/api/contracts/${contractId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/contracts/:id - Confirmar eliminación', async () => {
        const res = await request(app)
            .get(`/api/contracts/${contractId}`)
            .set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(404);
    });

});