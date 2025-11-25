const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const EventType = require('../models/EventType');

// --- DATOS GLOBALES PARA EL TEST ---
let tokenAdmin = '';
let tokenCoordinador = '';
let eventTypeId = ''; // Guardaremos el ID creado para editarlo/borrarlo

// 1. Usuario Admin (Poder absoluto)
const adminUser = {
    document: 88888888,
    fullname: "Admin EventType",
    username: "admin_type",
    email: "admin_type@test.com",
    password: "password123",
    role: "admin"
};

// 2. Usuario Coordinador (Para probar restricciones)
const coordUser = {
    document: 99999999,
    fullname: "Coord EventType",
    username: "coord_type",
    email: "coord_type@test.com",
    password: "password123",
    role: "coordinador"
};

// 3. Objeto Tipo de Evento de Prueba
const eventTypePrueba = {
    name: "Boda de Prueba Jest",
    description: "Tipo de evento creado por tests automatizados",
    category: "social", // Debe ser uno válido del enum
    estimatedDuration: 5,
    
    // Generamos un ID falso para cumplir con la referencia requerida
    requiredPersonnelType: new mongoose.Types.ObjectId(), 
    
    defaultResources: [
        {
            resourceType: "sonido",
            description: "Parlantes básicos",
            defaultQuantity: 2
        }
    ]
};

describe('Pruebas de Integración: Tipos de Evento', () => {

    // --- CONFIGURACIÓN INICIAL ---
    beforeAll(async () => {
        // 1. Conexión a DB Test
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // 2. Limpieza de datos previos
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await EventType.deleteMany({ name: eventTypePrueba.name });

        // 3. Crear Usuarios (Admin y Coordinador)
        // CORRECCIÓN: No encriptamos manualmente. Pasamos el objeto directo
        // y dejamos que el hook .pre('save') del modelo User haga el hash.
        
        await new User(adminUser).save(); // El modelo encriptará 'password123'
        await new User(coordUser).save(); // El modelo encriptará 'password123'
    });

    // --- LIMPIEZA FINAL ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await EventType.deleteMany({ name: eventTypePrueba.name });
        await mongoose.connection.close();
    });

    // --- PASO 1: LOGINS ---
    it('Debería loguearse como ADMIN y obtener token', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: adminUser.email,
            password: adminUser.password
        });
        expect(res.statusCode).toBe(200);
        tokenAdmin = res.body.token;
    });

    it('Debería loguearse como COORDINADOR y obtener token', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: coordUser.email,
            password: coordUser.password
        });
        expect(res.statusCode).toBe(200);
        tokenCoordinador = res.body.token;
    });

    // --- PASO 2: CREAR (POST) ---
    it('POST /api/event-types - Admin debería crear un Tipo de Evento', async () => {
        const res = await request(app)
            .post('/api/event-types')
            .set('x-access-token', tokenAdmin)
            .send(eventTypePrueba);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('name', eventTypePrueba.name);
        
        // Guardamos el ID para los siguientes tests
        eventTypeId = res.body.data._id;
    });

    it('POST /api/event-types - Debería fallar si el nombre ya existe', async () => {
        const res = await request(app)
            .post('/api/event-types')
            .set('x-access-token', tokenAdmin)
            .send(eventTypePrueba); // Enviamos el mismo objeto

        expect(res.statusCode).toBe(400); // Tu controlador maneja error code 11000 con status 400
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // --- PASO 3: LEER (GET) ---
    it('GET /api/event-types - Debería listar los tipos de evento', async () => {
        const res = await request(app)
            .get('/api/event-types')
            .set('x-access-token', tokenCoordinador); // Coordinador también puede ver

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        // Verificamos que nuestro evento creado esté en la lista
        const encontrado = res.body.data.find(e => e._id === eventTypeId);
        expect(encontrado).toBeTruthy();
    });

    it('GET /api/event-types/:id - Debería obtener el detalle por ID', async () => {
        const res = await request(app)
            .get(`/api/event-types/${eventTypeId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('_id', eventTypeId);
    });

    // --- PASO 4: ACTUALIZAR (PUT) ---
    it('PUT /api/event-types/:id - Coordinador actualiza descripción', async () => {
        const nuevaDesc = "Descripción actualizada por Coordinador";
        
        const res = await request(app)
            .put(`/api/event-types/${eventTypeId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ description: nuevaDesc });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.description).toBe(nuevaDesc);
    });

    // --- PASO 5: RESTRICCIONES ESPECIALES ---
    it('PUT /api/event-types/:id - Coordinador NO debe poder cambiar "active"', async () => {
        // Tu controlador bloquea explícitamente esto con 403
        const res = await request(app)
            .put(`/api/event-types/${eventTypeId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ active: false });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/no pueden cambiar el estado/i);
    });

    // --- PASO 6: ELIMINAR (DELETE) ---
    it('DELETE /api/event-types/:id - Admin elimina el tipo de evento', async () => {
        const res = await request(app)
            .delete(`/api/event-types/${eventTypeId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/eliminado correctamente/i);
    });

    it('GET /api/event-types/:id - Debería dar 404 después de eliminar', async () => {
        const res = await request(app)
            .get(`/api/event-types/${eventTypeId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(404);
    });

});