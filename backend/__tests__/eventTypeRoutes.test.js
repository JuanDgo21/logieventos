const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const EventType = require('../models/EventType');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let tokenLider = '';
let eventTypeId = '';
let personnelTypeId = new mongoose.Types.ObjectId(); // ID falso para cumplir el requisito del modelo
let adminId = '';

// 1. Datos Usuarios
const adminUser = {
    document: 11112222, fullname: "Admin Type", username: "admin_type", email: "adt@test.com", password: "123", role: "admin"
};
const coordUser = {
    document: 33334444, fullname: "Coord Type", username: "coord_type", email: "cot@test.com", password: "123", role: "coordinador"
};
const liderUser = {
    document: 55556666, fullname: "Lider Type", username: "lider_type", email: "lit@test.com", password: "123", role: "lider"
};

// Datos base para EventType
const baseEventType = {
    name: "Conferencia Tech",
    description: "Eventos de tecnología",
    category: "academico",
    requiredPersonnelType: personnelTypeId, // Obligatorio según tu modelo
    estimatedDuration: 5
};

describe('Pruebas de Integración: Tipos de Evento (FULL)', () => {

    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email, liderUser.email] } });
        await EventType.deleteMany({});
        await EventType.createIndexes();

        // Guardamos el usuario en una variable y capturamos su ID
        const admin = await new User(adminUser).save();
        adminId = admin._id; // <--- AQUÍ ASIGNAMOS EL VALOR

        await new User(coordUser).save();
        await new User(liderUser).save();
    });

    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email, liderUser.email] } });
        await EventType.deleteMany({});
        await mongoose.connection.close();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- LOGIN ---
    it('Login de todos los roles', async () => {
        const resA = await request(app).post('/api/auth/signin').send({ email: adminUser.email, password: adminUser.password });
        tokenAdmin = resA.body.token;
        const resC = await request(app).post('/api/auth/signin').send({ email: coordUser.email, password: coordUser.password });
        tokenCoordinador = resC.body.token;
        const resL = await request(app).post('/api/auth/signin').send({ email: liderUser.email, password: liderUser.password });
        tokenLider = resL.body.token;
        expect(resA.statusCode).toBe(200);
    });

    // ==================================================
    // 1. CREAR (CREATE)
    // ==================================================

    it('POST /api/event-types - Éxito: Admin crea Tipo de Evento', async () => {
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenAdmin).send(baseEventType);
        expect(res.statusCode).toBe(201);
        eventTypeId = res.body.data._id;
    });

    // Cubrir línea 101 (Default additionalRequirements)
    it('POST /api/event-types - Éxito: Crear sin requisitos adicionales (Array vacío por defecto)', async () => {
        const data = { ...baseEventType, name: "Sin Requisitos" };
        delete data.additionalRequirements; // Borramos para activar el || []
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenAdmin).send(data);
        expect(res.statusCode).toBe(201);
        expect(Array.isArray(res.body.data.additionalRequirements)).toBe(true);
    });

    // Cubrir línea 65 (Rol no autorizado)
    it('POST /api/event-types - Fallo: Lider no puede crear', async () => {
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenLider).send(baseEventType);
        expect(res.statusCode).toBe(403);
    });

    // Cubrir línea 81 (Campos obligatorios - Rama 1: Falta Name)
    it('POST /api/event-types - Fallo: Falta Name', async () => {
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenAdmin).send({ 
            category: "social", description: "Test" 
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/obligatorios/i);
    });

    // Cubrir línea 81 (Campos obligatorios - Rama 2: Falta Category)
    it('POST /api/event-types - Fallo: Falta Category', async () => {
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenAdmin).send({ 
            name: "Test Event", description: "Test" 
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/obligatorios/i);
    });

    // Cubrir línea 92 (Categoría inválida)
    it('POST /api/event-types - Fallo: Categoría inválida', async () => {
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenAdmin).send({ ...baseEventType, name: "Bad Cat", category: "fiesta_loca" });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/no válida/i);
    });

    // Cubrir catch duplicado (11000)
    it('POST /api/event-types - Fallo: Nombre duplicado', async () => {
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenAdmin).send(baseEventType);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // Cubrir línea 140 (Error 500 Create)
    it('POST /api/event-types - Error 500 al crear', async () => {
        jest.spyOn(EventType.prototype, 'save').mockImplementationOnce(() => { throw new Error('Crash Create'); });
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenAdmin).send({ ...baseEventType, name: "Fail 500" });
        expect(res.statusCode).toBe(500);
    });

    // ==================================================
    // 2. LEER (READ)
    // ==================================================

    it('GET /api/event-types - Listar todos', async () => {
        const res = await request(app).get('/api/event-types').set('x-access-token', tokenCoordinador);
        expect(res.statusCode).toBe(200);
    });

    // Cubrir línea 24 (Error 500 GetAll)
    it('GET /api/event-types - Error 500 al listar', async () => {
        jest.spyOn(EventType, 'find').mockImplementationOnce(() => { throw new Error('Crash List'); });
        const res = await request(app).get('/api/event-types').set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('GET /api/event-types/:id - Obtener por ID', async () => {
        const res = await request(app).get(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    it('GET /api/event-types/:id - Fallo: ID no existe (404)', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/event-types/${fakeId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(404);
    });

    // Cubrir línea 52 (Error 500 GetById)
    it('GET /api/event-types/:id - Error 500 al obtener', async () => {
        jest.spyOn(EventType, 'findById').mockImplementationOnce(() => { throw new Error('Crash Get'); });
        const res = await request(app).get(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    // Prueba especial para Líder viendo inactivo (si aplica lógica de negocio, aunque en getAll ya filtramos)
    // Tu controlador getEventTypeById tiene lógica de bloqueo si !active y es lider
    it('GET /api/event-types/:id - Fallo: Lider no puede ver inactivo', async () => {
        const inactiveType = await new EventType({ ...baseEventType, name: "Inactive Type", active: false, createdBy: adminId }).save();
        const res = await request(app).get(`/api/event-types/${inactiveType._id}`).set('x-access-token', tokenLider);
        expect(res.statusCode).toBe(403);
    });

    // ==================================================
    // 3. ACTUALIZAR (UPDATE)
    // ==================================================

    it('PUT /api/event-types/:id - Éxito: Actualizar descripción', async () => {
        const res = await request(app).put(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenAdmin).send({ description: "Updated" });
        expect(res.statusCode).toBe(200);
    });

    // Cubrir línea 179 (Rol no autorizado)
    it('PUT /api/event-types/:id - Fallo: Lider no puede actualizar', async () => {
        const res = await request(app).put(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenLider).send({ description: "Intruder" });
        expect(res.statusCode).toBe(403);
    });

    // Cubrir línea 197 (Coordinador cambiando active)
    it('PUT /api/event-types/:id - Fallo: Coordinador no puede cambiar estado', async () => {
        const res = await request(app).put(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenCoordinador).send({ active: false });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/no pueden cambiar el estado/i);
    });

    // Cubrir línea 202 (Categoría inválida en update)
    it('PUT /api/event-types/:id - Fallo: Categoría inválida en update', async () => {
        const res = await request(app).put(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenAdmin).send({ category: "mala_cat" });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/no válida/i);
    });

    // Cubrir línea 221 (404 en update)
    it('PUT /api/event-types/:id - Fallo: ID válido no existente', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/event-types/${fakeId}`).set('x-access-token', tokenAdmin).send({ description: "Ghost" });
        expect(res.statusCode).toBe(404);
    });

    // Cubrir catch duplicado en update (Líneas 235-243)
    it('PUT /api/event-types/:id - Fallo: Nombre duplicado en update', async () => {
        // Creamos otro para chocar nombres
        await new EventType({ ...baseEventType, name: "Type B", createdBy: adminId }).save();
        const res = await request(app).put(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenAdmin).send({ name: "Type B" });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // Cubrir Error 500 en update
    it('PUT /api/event-types/:id - Error 500 al actualizar', async () => {
        jest.spyOn(EventType, 'findByIdAndUpdate').mockImplementationOnce(() => { throw new Error('Crash Update'); });
        const res = await request(app).put(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenAdmin).send({ description: "X" });
        expect(res.statusCode).toBe(500);
    });

    // ==================================================
    // 4. ELIMINAR (DELETE)
    // ==================================================

    // Cubrir línea 260 (Rol no autorizado)
    it('DELETE /api/event-types/:id - Fallo: Coordinador no puede eliminar', async () => {
        const res = await request(app).delete(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenCoordinador);
        expect(res.statusCode).toBe(403);
    });

    it('DELETE /api/event-types/:id - Éxito: Admin elimina', async () => {
        const res = await request(app).delete(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    // Cubrir línea 281 (404 en delete)
    it('DELETE /api/event-types/:id - Fallo: ID no encontrado', async () => {
        const res = await request(app).delete(`/api/event-types/${eventTypeId}`).set('x-access-token', tokenAdmin); // Ya borrado
        expect(res.statusCode).toBe(404);
    });

    // Cubrir línea 294 (Error 500 Delete)
    it('DELETE /api/event-types/:id - Error 500 al eliminar', async () => {
        const temp = await new EventType({ ...baseEventType, name: "Temp Del", createdBy: adminId }).save();
        jest.spyOn(EventType, 'findByIdAndDelete').mockImplementationOnce(() => { throw new Error('Crash Del'); });
        const res = await request(app).delete(`/api/event-types/${temp._id}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });


    it('POST /api/event-types - Fallo: Nombre vacío string', async () => {
        const res = await request(app).post('/api/event-types').set('x-access-token', tokenAdmin).send({ 
            ...baseEventType, 
            name: "" 
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/obligatorios/i);
    });

    // 2. Refuerzo Línea 179: Lider intenta Update (Rol check)
    // Aseguramos que tokenLider es válido antes
    it('PUT /api/event-types/:id - Fallo: Lider bloqueado en update', async () => {
        const temp = await new EventType({ ...baseEventType, name: "Temp Update Role", createdBy: adminId }).save();
        
        const res = await request(app)
            .put(`/api/event-types/${temp._id}`)
            .set('x-access-token', tokenLider)
            .send({ description: "Hacked" });
            
        expect(res.statusCode).toBe(403);
        // CAMBIO: Aceptamos el mensaje del middleware O el del controlador
        expect(res.body.message).toMatch(/no tienes los permisos|Solo administradores/i);
    });

    // 3. Refuerzo Línea 197: Coordinador intenta cambiar Active
    it('PUT /api/event-types/:id - Fallo: Coordinador bloqueado en active', async () => {
        const temp = await new EventType({ ...baseEventType, name: "Temp Active Role", createdBy: adminId }).save();
        
        const res = await request(app)
            .put(`/api/event-types/${temp._id}`)
            .set('x-access-token', tokenCoordinador)
            .send({ active: false }); // Intento prohibido
            
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/no pueden cambiar el estado/i);
    });

    // 4. Refuerzo Línea 260: Coordinador intenta Delete
    it('DELETE /api/event-types/:id - Fallo: Coordinador bloqueado en delete', async () => {
        const temp = await new EventType({ ...baseEventType, name: "Temp Del Role", createdBy: adminId }).save();
        
        const res = await request(app)
            .delete(`/api/event-types/${temp._id}`)
            .set('x-access-token', tokenCoordinador);
            
        expect(res.statusCode).toBe(403);
        // CAMBIO: Aceptamos el mensaje del middleware O el del controlador
        expect(res.body.message).toMatch(/no tienes los permisos|Solo administradores/i);
    });

    
});