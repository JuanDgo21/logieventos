const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Modelos
const User = require('../models/User');
const Report = require('../models/Report');
const Contract = require('../models/Contract');
const EventType = require('../models/EventType'); // Necesario para populate profundo

// Variables
let tokenAdmin = '';
let reportId = '';

const adminUser = {
    document: 66677788,
    fullname: "Admin Report",
    username: "admin_report",
    email: "report@test.com",
    password: "password123",
    role: "admin"
};

describe('Pruebas de Integración: Reportes del Sistema', () => {

    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // Limpieza profunda
        await User.deleteMany({ email: adminUser.email });
        await Report.deleteMany({});
        await Contract.deleteMany({});
        await EventType.deleteMany({});

        // Crear Admin
        await new User(adminUser).save();
    });

    afterAll(async () => {
        await User.deleteMany({ email: adminUser.email });
        await Report.deleteMany({});
        await Contract.deleteMany({});
        await EventType.deleteMany({});
        await mongoose.connection.close();
    });

    // LOGIN
    it('Login Admin', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: adminUser.email, password: adminUser.password
        });
        tokenAdmin = res.body.token;
        expect(res.statusCode).toBe(200);
    });

    // --- 1. CRUD DE REPORTES MANUALES ---
    it('POST /api/reports - Crear reporte manual', async () => {
        const res = await request(app)
            .post('/api/reports')
            .set('x-access-token', tokenAdmin)
            .send({
                title: "Reporte Manual Jest",
                description: "Prueba de creación",
                type: "custom", // <--- CORRECCIÓN: 'general' no existe en el enum, 'custom' sí.
                data: { info: "test" }
            });

        expect(res.statusCode).toBe(201);
        reportId = res.body.data._id;
    });

    it('GET /api/reports - Listar reportes', async () => {
        const res = await request(app)
            .get('/api/reports')
            .set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/reports/:id - Obtener por ID', async () => {
        const res = await request(app)
            .get(`/api/reports/${reportId}`)
            .set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
    });

    it('PUT /api/reports/:id - Actualizar reporte', async () => {
        const res = await request(app)
            .put(`/api/reports/${reportId}`)
            .set('x-access-token', tokenAdmin)
            .send({ title: "Título Actualizado" });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data.title).toBe("Título Actualizado");
    });

    it('DELETE /api/reports/:id - Eliminar reporte', async () => {
        const res = await request(app)
            .delete(`/api/reports/${reportId}`)
            .set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
    });

    // --- 2. REPORTES AUTOMÁTICOS ---
    
    it('POST /api/reports - Crear reporte tipo "contract"', async () => {
        // Crear contrato dummy
        await new Contract({
            name: "Contrato Dummy Reporte",
            clientName: "Cliente X",
            clientEmail: "x@x.com",
            startDate: new Date(),
            endDate: new Date(),
            // Campos requeridos mínimos para que pase validación
            createdBy: new mongoose.Types.ObjectId() 
        }).save();

        const res = await request(app)
            .post('/api/reports')
            .set('x-access-token', tokenAdmin)
            .send({
                title: "Reporte Contratos Auto",
                description: "Test logic",
                type: "contract" // Válido en enum
            });

        expect(res.statusCode).toBe(201);
        expect(Array.isArray(res.body.data.data)).toBe(true);
        expect(res.body.data.data.length).toBeGreaterThan(0);
    });

    it('POST /api/reports/from-contracts - Ruta Especial', async () => {
        // Esta ruta requiere que el modelo Contract tenga el campo 'event' definido
        // Asegúrate de haber agregado "event" al esquema de Contract.js
        const res = await request(app)
            .post('/api/reports/from-contracts')
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toMatch(/Reporte creado/);
    });

});