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

    // ==================================================================
    // 🔥 ZONA DE SABOTAJE: PRUEBAS DE ERROR 500 (EVENTOS)
    // ==================================================================

    it('GET /api/events - Error 500 al listar', async () => {
        jest.spyOn(Event, 'find').mockImplementationOnce(() => { throw new Error('DB Crash List'); });
        const res = await request(app).get('/api/events');
        expect(res.statusCode).toBe(500);
    });

    it('GET /api/events/:id - Error 500 al buscar por ID', async () => {
        jest.spyOn(Event, 'findById').mockImplementationOnce(() => { throw new Error('DB Crash Find'); });
        const res = await request(app).get(`/api/events/${eventId}`);
        expect(res.statusCode).toBe(500);
    });

    it('POST /api/events - Error 500 al crear', async () => {
        // Pasamos validaciones previas usando datos válidos, pero fallamos al guardar
        jest.spyOn(Event.prototype, 'save').mockImplementationOnce(() => { throw new Error('DB Crash Save'); });
        
        const res = await request(app)
            .post('/api/events')
            .set('x-access-token', tokenAdmin)
            .send({ 
                ...eventPrueba, 
                name: "Evento Error 500", 
                eventType: eventTypeId, 
                contract: contractId, 
                responsable: responsableId 
            });

        expect(res.statusCode).toBe(500);
    });

    it('PUT /api/events/:id - Error 500 al actualizar', async () => {
        jest.spyOn(Event, 'findByIdAndUpdate').mockImplementationOnce(() => { throw new Error('DB Crash Update'); });
        const res = await request(app)
            .put(`/api/events/${eventId}`)
            .set('x-access-token', tokenAdmin)
            .send({ description: "Update Fail" });
        
        expect(res.statusCode).toBe(500);
    });

    it('DELETE /api/events/:id - Error 500 al eliminar', async () => {
        jest.spyOn(Event, 'findByIdAndDelete').mockImplementationOnce(() => { throw new Error('DB Crash Delete'); });
        const res = await request(app)
            .delete(`/api/events/${eventId}`)
            .set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(500);
    });

    // Cubrir Línea 110-111: Update EventType (Fallo 404)
    it('PUT /api/events/:id - Fallo: Actualizar con EventType inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/events/${eventId}`)
            .set('x-access-token', tokenAdmin)
            .send({ eventType: fakeId });
            
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/tipo de evento no existe/i);
    });

    // Cubrir Línea 118-119: Update Contract (Fallo 404) - Ya tenías uno parecido, reforzamos
    it('PUT /api/events/:id - Fallo: Actualizar con Contrato inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/events/${eventId}`)
            .set('x-access-token', tokenAdmin)
            .send({ contract: fakeId });
            
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/contrato no existe/i);
    });

    // Cubrir Línea 123: Update Responsable (Fallo 404)
    it('PUT /api/events/:id - Fallo: Actualizar con Responsable inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/events/${eventId}`)
            .set('x-access-token', tokenAdmin)
            .send({ responsable: fakeId });
            
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/responsable no existe/i);
    });

    // Cubrir Línea 127 (Update Evento no encontrado - ya cubierto, pero aseguramos)
    it('PUT /api/events/:id - Fallo: Evento no encontrado (ID válido)', async () => {
        const fakeEventId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/events/${fakeEventId}`)
            .set('x-access-token', tokenAdmin)
            .send({ name: "Ghost Event" });
            
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/evento no encontrado/i);
    });

    // 1. Refuerzo Línea 81: Validar campos obligatorios básicos (Name)
    it('POST /api/events - Fallo: Nombre faltante', async () => {
        const res = await request(app).post('/api/events').set('x-access-token', tokenAdmin).send({
            ...eventPrueba,
            name: "" // Vacío
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/obligatorios/i);
    });

    // 2. Refuerzo Línea 141: Error 500 en Update (Mock alternativo)
    it('PUT /api/events/:id - Error 500 Force (Alternative)', async () => {
        jest.restoreAllMocks();
        // A veces mongoose usa findOneAndUpdate internamente
        jest.spyOn(Event, 'findByIdAndUpdate').mockImplementation(() => { throw new Error('Crash Upd'); });
        
        const res = await request(app).put(`/api/events/${eventId}`).set('x-access-token', tokenAdmin).send({ name: "X" });
        expect(res.statusCode).toBe(500);
    });

    // 3. Refuerzo Línea 145: Error 500 en Delete (Mock alternativo)
    it('DELETE /api/events/:id - Error 500 Force (Alternative)', async () => {
        jest.restoreAllMocks();
        // A veces mongoose usa findOneAndDelete internamente
        jest.spyOn(Event, 'findByIdAndDelete').mockImplementation(() => { throw new Error('Crash Del'); });
        
        const res = await request(app).delete(`/api/events/${eventId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('POST /api/events - Fallo: Faltan fechas o tipo de evento', async () => {
        const res = await request(app).post('/api/events').set('x-access-token', tokenAdmin).send({
            name: "Evento Sin Fechas"
            // No enviamos startDate, endDate ni eventType
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/obligatorios/i);
    });
});