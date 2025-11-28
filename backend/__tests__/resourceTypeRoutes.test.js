const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const ResourceType = require('../models/ResourceType');

// Importamos el controlador para la prueba unitaria del 403
const resourceTypeController = require('../controllers/resourceTypeControllers');

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

describe('Pruebas de Tipos de Recurso (Integración + Unitarias)', () => {

    // --- CONFIGURACIÓN INICIAL ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test_resourcetype_v3'; 
        await mongoose.connect(testDB);
        await User.deleteMany({});
        await ResourceType.deleteMany({});
        await new User(adminUser).save();
        await new User(coordUser).save();
    });

    // --- LIMPIEZA FINAL ---
    afterAll(async () => {
        await User.deleteMany({});
        await ResourceType.deleteMany({});
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

    // =================================================================
    // 1. PRUEBAS DE CREACIÓN (POST)
    // =================================================================
    describe('POST /api/resource-types', () => {
        it('Admin crea Tipo de Recurso exitosamente', async () => {
            const res = await request(app)
                .post('/api/resource-types')
                .set('x-access-token', tokenAdmin)
                .send(resourceTypePrueba);

            expect(res.statusCode).toBe(201);
            resourceTypeId = res.body.data._id;
        });

        it('Error 400: Al intentar crear duplicado', async () => {
            const res = await request(app)
                .post('/api/resource-types')
                .set('x-access-token', tokenAdmin)
                .send(resourceTypePrueba);
            expect(res.statusCode).toBe(400);
        });

        it('Error 400: Falta el campo nombre', async () => {
            const res = await request(app)
                .post('/api/resource-types')
                .set('x-access-token', tokenAdmin)
                .send({ description: "Sin nombre" });
            expect(res.statusCode).toBe(400);
        });

        it('Error 403 (Unitario): Usuario con rol desconocido intenta crear', async () => {
            const req = { userRole: 'invitado', body: { name: 'Hacker' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await resourceTypeController.createResourceType(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('Error 500: Fallo en base de datos al guardar', async () => {
            // Aquí NO hay encadenamiento, es .save() directo, así que este mock simple funciona
            const mockSave = jest.spyOn(ResourceType.prototype, 'save')
                                 .mockImplementationOnce(() => Promise.reject(new Error("Error DB forzado")));

            const res = await request(app)
                .post('/api/resource-types')
                .set('x-access-token', tokenAdmin)
                .send({ name: "Test 500" });

            expect(res.statusCode).toBe(500);
            mockSave.mockRestore(); 
        });
    });

    // =================================================================
    // 2. PRUEBAS DE LECTURA (GET)
    // =================================================================
    describe('GET /api/resource-types', () => {
        it('Coordinador lista todos', async () => {
            const res = await request(app)
                .get('/api/resource-types')
                .set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        // --- CORRECCIÓN 1: Mock Encadenado para find().populate() ---
        it('Error 500: Fallo al obtener lista', async () => {
            const mockFind = jest.spyOn(ResourceType, 'find')
                .mockImplementationOnce(() => ({ 
                    // Simulamos que find() devuelve un objeto con la función populate
                    // Y populate es quien devuelve la Promesa rechazada (donde explota el await)
                    populate: jest.fn().mockRejectedValue(new Error("Error DB"))
                }));

            const res = await request(app)
                .get('/api/resource-types')
                .set('x-access-token', tokenCoordinador);

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe("Error DB"); // Verificamos que sea nuestro error
            mockFind.mockRestore();
        });
    });

    describe('GET /api/resource-types/active', () => {
        it('Listar solo activos', async () => {
            const res = await request(app)
                .get('/api/resource-types/active')
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        // --- CORRECCIÓN 2: Mock Encadenado para find().populate().select() ---
        it('Error 500: Fallo al obtener activos', async () => {
            const mockFind = jest.spyOn(ResourceType, 'find')
                .mockImplementationOnce(() => ({
                    // 1. find() devuelve objeto con populate
                    populate: jest.fn().mockReturnValue({
                        // 2. populate() devuelve objeto con select (encadenamiento)
                        select: jest.fn().mockRejectedValue(new Error("Error DB")) // 3. select falla
                    })
                }));
            
            const res = await request(app)
                .get('/api/resource-types/active')
                .set('x-access-token', tokenAdmin);

            expect(res.statusCode).toBe(500);
            mockFind.mockRestore();
        });
    });

    describe('GET /api/resource-types/:id', () => {
        it('Obtiene por ID', async () => {
            const res = await request(app)
                .get(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        it('Error 404: ID no encontrado', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/resource-types/${fakeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        it('Error 500: ID inválido', async () => {
            const res = await request(app)
                .get(`/api/resource-types/ID-MALO`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
        });
    });

    // =================================================================
    // 3. PRUEBAS DE ACTUALIZACIÓN (PUT)
    // =================================================================
    describe('PUT /api/resource-types/:id', () => {
        it('Coordinador actualiza descripción', async () => {
            const res = await request(app)
                .put(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenCoordinador)
                .send({ description: "Desc Updated" });
            expect(res.statusCode).toBe(200);
        });

        it('Error 403: Coordinador intenta desactivar', async () => {
            const res = await request(app)
                .put(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenCoordinador)
                .send({ active: false });
            expect(res.statusCode).toBe(403);
        });

        it('Admin SI puede cambiar active', async () => {
            const res = await request(app)
                .put(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ active: false });
            expect(res.statusCode).toBe(200);
        });

        it('Error 400: Nombre duplicado', async () => {
             const otro = await ResourceType.create({ 
                name: "Laptop Gamer", 
                description: "Test Dup",
                createdBy: new mongoose.Types.ObjectId() 
            });
            const res = await request(app)
                .put(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ name: "Laptop Gamer" });
            expect(res.statusCode).toBe(400);
        });

        it('Error 404: Recurso no existe', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/resource-types/${fakeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ name: "Nada" });
            expect(res.statusCode).toBe(404);
        });

        // --- CORRECCIÓN 3: Mock Encadenado para findByIdAndUpdate().populate() ---
        it('Error 500: Fallo DB en update', async () => {
            const mockUpdate = jest.spyOn(ResourceType, 'findByIdAndUpdate')
                .mockImplementationOnce(() => ({
                    // findByIdAndUpdate devuelve objeto con populate, el cual falla
                    populate: jest.fn().mockRejectedValue(new Error("Error Update"))
                }));
            
            const res = await request(app)
                .put(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ name: "Error" });
            
            expect(res.statusCode).toBe(500);
            mockUpdate.mockRestore();
        });
    });

    // =================================================================
    // 4. PRUEBAS DE ELIMINACIÓN (DELETE)
    // =================================================================
    describe('DELETE /api/resource-types/:id', () => {
        // ... (resto de las pruebas sin cambios porque delete no usa populate en tu controlador)
        it('Error 403: Coordinador intenta eliminar', async () => {
            const res = await request(app)
                .delete(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(403);
        });

        it('Admin elimina exitosamente', async () => {
            const res = await request(app)
                .delete(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        it('Error 404: Ya eliminado', async () => {
            const res = await request(app)
                .delete(`/api/resource-types/${resourceTypeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        it('Error 500: Fallo DB en delete', async () => {
            const mockDel = jest.spyOn(ResourceType, 'findByIdAndDelete')
                                .mockImplementationOnce(() => Promise.reject(new Error("Error Delete")));
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/resource-types/${fakeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            mockDel.mockRestore();
        });
    });
});