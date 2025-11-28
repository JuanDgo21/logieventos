const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const ProviderType = require('../models/ProviderType');

// Importamos el controlador para pruebas unitarias de roles y lógicas específicas
const providerTypeController = require('../controllers/providerTypeControllers');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let providerTypeId = '';

// 1. Datos Admin
const adminUser = {
    document: 11111111,
    fullname: "Admin ProviderType",
    username: "admin_prov_type",
    email: "admin_prov@test.com",
    password: "password123",
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

describe('Pruebas de Tipos de Proveedor (Integración + Unitarias)', () => {

    // --- SETUP ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test_providertype_full';
        await mongoose.connect(testDB);

        await User.deleteMany({});
        await ProviderType.deleteMany({});
        
        await new User(adminUser).save();
        await new User(coordUser).save();
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        await User.deleteMany({});
        await ProviderType.deleteMany({});
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
    // 1. CREATE (POST)
    // =================================================================
    describe('POST /api/provider-types', () => {
        it('Admin crea un Tipo de Proveedor exitosamente', async () => {
            const res = await request(app)
                .post('/api/provider-types')
                .set('x-access-token', tokenAdmin)
                .send(providerTypePrueba);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.name).toBe(providerTypePrueba.name);
            providerTypeId = res.body.data._id;
        });

        it('Error 400: Nombre duplicado', async () => {
            const res = await request(app)
                .post('/api/provider-types')
                .set('x-access-token', tokenAdmin)
                .send(providerTypePrueba);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/ya existe/i);
        });

        it('Error 400: Falta el nombre', async () => {
            const res = await request(app)
                .post('/api/provider-types')
                .set('x-access-token', tokenAdmin)
                .send({ description: "Sin nombre" });
            expect(res.statusCode).toBe(400);
        });

        it('Error 403 (Unitario): Usuario sin permisos intenta crear', async () => {
            const req = { userRole: 'invitado', body: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            await providerTypeController.createProviderType(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('Error 500: Fallo DB al guardar', async () => {
            const mockSave = jest.spyOn(ProviderType.prototype, 'save')
                                 .mockImplementationOnce(() => Promise.reject(new Error("Error DB")));
            
            const res = await request(app)
                .post('/api/provider-types')
                .set('x-access-token', tokenAdmin)
                .send({ name: "Error 500 Type" });

            expect(res.statusCode).toBe(500);
            mockSave.mockRestore();
        });
    });

    // =================================================================
    // 2. READ ALL (GET)
    // =================================================================
    describe('GET /api/provider-types', () => {
        it('Coordinador lista todos los tipos', async () => {
            const res = await request(app)
                .get('/api/provider-types')
                .set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('Unitario: Rol "lider" filtra solo activos', async () => {
            const req = { userRole: 'lider' };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            // Mockeamos find().populate()
            const mockPopulate = jest.fn();
            const mockFind = jest.spyOn(ProviderType, 'find').mockReturnValue({
                populate: mockPopulate
            });

            await providerTypeController.getAllProviderTypes(req, res);

            expect(mockFind).toHaveBeenCalledWith({ isActive: true });
            mockFind.mockRestore();
        });

        it('Error 500: Fallo al listar', async () => {
            const mockFind = jest.spyOn(ProviderType, 'find')
                .mockImplementationOnce(() => ({
                    populate: jest.fn().mockRejectedValue(new Error("Error DB"))
                }));

            const res = await request(app)
                .get('/api/provider-types')
                .set('x-access-token', tokenAdmin);
            
            expect(res.statusCode).toBe(500);
            mockFind.mockRestore();
        });
    });

    // =================================================================
    // 3. READ ONE (GET BY ID)
    // =================================================================
    describe('GET /api/provider-types/:id', () => {
        it('Obtiene detalle por ID', async () => {
            const res = await request(app)
                .get(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        it('Error 404: ID no encontrado', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/provider-types/${fakeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        it('Unitario: Rol "lider" intenta ver tipo inactivo (403)', async () => {
            const req = { 
                userRole: 'lider', 
                params: { id: 'someId' } 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mockeamos respuesta de DB con isActive: false
            const mockFind = jest.spyOn(ProviderType, 'findById').mockReturnValue({
                populate: jest.fn().mockResolvedValue({ isActive: false })
            });

            await providerTypeController.getProviderTypeById(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            mockFind.mockRestore();
        });

        it('Error 500: Fallo DB', async () => {
            const mockFind = jest.spyOn(ProviderType, 'findById')
                .mockImplementationOnce(() => ({
                    populate: jest.fn().mockRejectedValue(new Error("Error DB"))
                }));
            
            const res = await request(app)
                .get(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            mockFind.mockRestore();
        });
    });

    // =================================================================
    // 4. UPDATE (PUT)
    // =================================================================
    describe('PUT /api/provider-types/:id', () => {
        it('Coordinador actualiza descripción (Permitido)', async () => {
            const res = await request(app)
                .put(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenCoordinador)
                .send({ description: "Desc Editada" });
            expect(res.statusCode).toBe(200);
            expect(res.body.data.description).toBe("Desc Editada");
        });

        it('Error 403: Coordinador intenta cambiar "isActive"', async () => {
            const res = await request(app)
                .put(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenCoordinador)
                .send({ isActive: false });
            expect(res.statusCode).toBe(403);
        });

        it('Admin SI puede cambiar "isActive"', async () => {
            const res = await request(app)
                .put(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ isActive: false });
            expect(res.statusCode).toBe(200);
            expect(res.body.data.isActive).toBe(false);
        });

        it('Error 400: Nombre duplicado en update', async () => {
            // Crear otro tipo primero
            await ProviderType.create({
                name: "Otro Tipo",
                createdBy: new mongoose.Types.ObjectId()
            });

            const res = await request(app)
                .put(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ name: "Otro Tipo" });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/ya existe/i);
        });

        it('Error 404: Actualizar no existente', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/provider-types/${fakeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ name: "Fantasma" });
            expect(res.statusCode).toBe(404);
        });

        it('Error 403 (Unitario): Rol no permitido en update', async () => {
            const req = { userRole: 'invitado', body: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            await providerTypeController.updateProviderType(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('Error 500: Fallo DB en Update', async () => {
            const mockUpdate = jest.spyOn(ProviderType, 'findByIdAndUpdate')
                .mockImplementationOnce(() => ({
                    populate: jest.fn().mockRejectedValue(new Error("Error Update"))
                }));
            
            const res = await request(app)
                .put(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenAdmin)
                .send({ name: "Error" });
            
            expect(res.statusCode).toBe(500);
            mockUpdate.mockRestore();
        });
    });

    // =================================================================
    // 5. DELETE (DELETE)
    // =================================================================
    describe('DELETE /api/provider-types/:id', () => {
        it('Error 403: Coordinador intenta eliminar', async () => {
            const res = await request(app)
                .delete(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(403);
        });

        it('Admin elimina el registro exitosamente', async () => {
            const res = await request(app)
                .delete(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        it('Error 404: Eliminar no existente', async () => {
            const res = await request(app)
                .delete(`/api/provider-types/${providerTypeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        it('Error 500: Fallo DB en Delete', async () => {
            const mockDel = jest.spyOn(ProviderType, 'findByIdAndDelete')
                                .mockRejectedValueOnce(new Error("Error Delete"));
            
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/provider-types/${fakeId}`)
                .set('x-access-token', tokenAdmin);
            
            expect(res.statusCode).toBe(500);
            mockDel.mockRestore();
        });
    });

});