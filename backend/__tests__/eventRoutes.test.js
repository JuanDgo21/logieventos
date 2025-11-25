const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Modelos necesarios
const User = require('../models/User');
const Event = require('../models/Event');
const EventType = require('../models/EventType');
const Contract = require('../models/Contract');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let eventId = '';

// IDs de Dependencias
let eventTypeId = '';
let contractId = '';
let responsableId = ''; // Usaremos el ID del coordinador como responsable

// 1. Datos Admin
const adminUser = {
    document: 98765432,
    fullname: "Admin Eventos",
    username: "admin_events",
    email: "admin_evt@test.com",
    password: "password123",
    role: "admin"
};

// 2. Datos Coordinador
const coordUser = {
    document: 87654321,
    fullname: "Coord Eventos",
    username: "coord_events",
    email: "coord_evt@test.com",
    password: "password123",
    role: "coordinador"
};

// 3. Objeto de Prueba (Evento)
const eventPrueba = {
    name: "Gran Lanzamiento 2025",
    description: "Evento de presentación de producto",
    location: "Centro de Convenciones",
    startDate: "2025-10-20T09:00:00.000Z",
    endDate: "2025-10-20T18:00:00.000Z",
    // eventType, contract y responsable se llenan dinámicamente
};

describe('Pruebas de Integración: Gestión de Eventos (FINAL)', () => {

    // --- SETUP ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // 1. Limpieza Total
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Event.deleteMany({});
        await EventType.deleteMany({});
        await Contract.deleteMany({});

        // 2. Asegurar índices (Vital para unique: true del nombre)
        await Event.createIndexes();

        // 3. Crear Usuarios
        await new User(adminUser).save();
        const coord = await new User(coordUser).save();
        responsableId = coord._id; // El coordinador será el responsable

        // 4. Crear Dependencia: TIPO DE EVENTO
        const tipo = await new EventType({
            name: "Corporativo Test",
            category: "corporativo",
            // Agregamos un ID falso para satisfacer el requisito del modelo
            requiredPersonnelType: new mongoose.Types.ObjectId(), // <--- ¡ESTA LÍNEA FALTABA!
            createdBy: coord._id
        }).save();
        eventTypeId = tipo._id;

        // 5. Crear Dependencia: CONTRATO (Simplificado)
        // No necesitamos recursos/proveedores para que el contrato exista
        const contrato = await new Contract({
            name: "Contrato Lanzamiento",
            clientName: "Tech Corp",
            clientEmail: "cliente@tech.com",
            startDate: "2025-10-01",
            endDate: "2025-10-30",
            createdBy: coord._id
        }).save();
        contractId = contrato._id;
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Event.deleteMany({});
        await EventType.deleteMany({});
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
    it('POST /api/events - Error si Tipo de Evento no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .post('/api/events')
            .set('x-access-token', tokenAdmin)
            .send({ 
                ...eventPrueba, 
                eventType: fakeId,
                contract: contractId,
                responsable: responsableId
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/no existe/i);
    });

    it('POST /api/events - Error de Fechas (Inicio > Fin)', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('x-access-token', tokenAdmin)
            .send({ 
                ...eventPrueba, 
                eventType: eventTypeId,
                contract: contractId,
                responsable: responsableId,
                startDate: "2025-12-31",
                endDate: "2025-01-01" // Fecha anterior
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/no puede ser posterior/i);
    });

    it('POST /api/events - Admin crea Evento Correctamente', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('x-access-token', tokenAdmin)
            .send({ 
                ...eventPrueba, 
                eventType: eventTypeId, 
                contract: contractId,
                responsable: responsableId
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(eventPrueba.name);
        
        eventId = res.body.data._id;
    });

    it('POST /api/events - Error al duplicar nombre', async () => {
        // Solo pasará si agregaste unique: true al modelo Event
        const res = await request(app)
            .post('/api/events')
            .set('x-access-token', tokenAdmin)
            .send({ 
                ...eventPrueba, 
                eventType: eventTypeId, 
                contract: contractId,
                responsable: responsableId
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // --- READ (GET) ---
    it('GET /api/events - Listar eventos (Público)', async () => {
        const res = await request(app).get('/api/events');
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        // Verificar que popula las relaciones
        expect(res.body.data[0]).toHaveProperty('eventType');
        expect(res.body.data[0].eventType).toHaveProperty('name');
    });

    it('GET /api/events/:id - Detalle de evento', async () => {
        const res = await request(app).get(`/api/events/${eventId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.location).toBe(eventPrueba.location);
    });

    // --- UPDATE (PUT) ---
    it('PUT /api/events/:id - Coordinador actualiza estado', async () => {
        const res = await request(app)
            .put(`/api/events/${eventId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ status: "en_progreso" });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe("en_progreso");
    });

    it('PUT /api/events/:id - Error si contrato no existe (Validación Update)', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/events/${eventId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ contract: fakeId });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/contrato no existe/i);
    });

    // --- DELETE (DELETE) ---
    it('DELETE /api/events/:id - Admin elimina evento', async () => {
        const res = await request(app)
            .delete(`/api/events/${eventId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
    });

    it('GET /api/events/:id - Confirmar eliminación', async () => {
        const res = await request(app).get(`/api/events/${eventId}`);
        expect(res.statusCode).toBe(404);
    });

});