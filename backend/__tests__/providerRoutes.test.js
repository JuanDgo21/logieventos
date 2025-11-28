const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Provider = require('../models/Provider');
const ProviderType = require('../models/ProviderType');
// Importamos Contract para poder mockearlo
const Contract = require('../models/Contract');

// Importamos el controlador directamente para pruebas unitarias de roles específicos
const providerController = require('../controllers/providerControllers');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let providerTypeId = '';
let providerId = '';

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

// 3. Proveedor de Prueba
const providerPrueba = {
    name: "Empresa Sonido Total",
    contactPerson: "Juan Perez",
    email: "ventas@sonidototal.com",
    phone: "3001234567",
    address: "Av Siempre Viva 123"
};

describe('Pruebas de Proveedores (Integración + Unitarias)', () => {

    // --- SETUP ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test_providers_full';
        await mongoose.connect(testDB);

        await User.deleteMany({});
        await Provider.deleteMany({});
        await ProviderType.deleteMany({});
        await Contract.deleteMany({}); // Limpieza de contratos

        await new User(adminUser).save();
        await new User(coordUser).save();

        const tipo = await new ProviderType({
            name: "Tecnología",
            description: "Equipos de computo",
            createdBy: new mongoose.Types.ObjectId()
        }).save();
        providerTypeId = tipo._id;
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        await User.deleteMany({});
        await Provider.deleteMany({});
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
    describe('POST /api/providers', () => {
        it('Admin crea proveedor exitosamente', async () => {
            const res = await request(app)
                .post('/api/providers')
                .set('x-access-token', tokenAdmin)
                .send({ ...providerPrueba, providerType: providerTypeId });

            expect(res.statusCode).toBe(201);
            providerId = res.body.data._id;
        });

        it('Error 400: Campos faltantes', async () => {
            const res = await request(app)
                .post('/api/providers')
                .set('x-access-token', tokenAdmin)
                .send({ name: "Incompleto" }); // Falta email y tipo
            expect(res.statusCode).toBe(400);
        });

        it('Error 404: Tipo de proveedor no existe', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .post('/api/providers')
                .set('x-access-token', tokenAdmin)
                .send({ ...providerPrueba, email: "otro@mail.com", providerType: fakeId });
            expect(res.statusCode).toBe(404);
        });

        it('Error 403 (Unitario): Usuario sin rol permitido', async () => {
            const req = { userRole: 'invitado', body: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            await providerController.createProvider(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('Error 500: Fallo DB al guardar', async () => {
            const mockSave = jest.spyOn(Provider.prototype, 'save')
                                 .mockImplementationOnce(() => Promise.reject(new Error("DB Error")));
            
            const res = await request(app)
                .post('/api/providers')
                .set('x-access-token', tokenAdmin)
                .send({ ...providerPrueba, email: "error500@mail.com", providerType: providerTypeId });
            
            expect(res.statusCode).toBe(500);
            mockSave.mockRestore();
        });
    });

    // =================================================================
    // 2. READ ALL (GET)
    // =================================================================
    describe('GET /api/providers', () => {
        it('Admin lista todos los proveedores', async () => {
            const res = await request(app)
                .get('/api/providers')
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('Unitario: Rol "lider" filtra solo activos', async () => {
            // Simulamos la request de un 'lider'
            const req = { userRole: 'lider' };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            // Mockeamos la cadena find().populate()
            const mockPopulate = jest.fn();
            const mockFind = jest.spyOn(Provider, 'find').mockReturnValue({
                populate: mockPopulate
            });

            await providerController.getAllProviders(req, res);

            // Verificamos que se llamó a find con el filtro correcto
            expect(mockFind).toHaveBeenCalledWith({ status: 'activo' });
            mockFind.mockRestore();
        });

        it('Error 500: Fallo al listar', async () => {
            const mockFind = jest.spyOn(Provider, 'find')
                .mockImplementationOnce(() => ({
                    populate: jest.fn().mockRejectedValue(new Error("Error DB"))
                }));

            const res = await request(app)
                .get('/api/providers')
                .set('x-access-token', tokenAdmin);
            
            expect(res.statusCode).toBe(500);
            mockFind.mockRestore();
        });
    });

    // =================================================================
    // 3. READ ONE (GET BY ID)
    // =================================================================
    describe('GET /api/providers/:id', () => {
        it('Obtiene proveedor por ID', async () => {
            const res = await request(app)
                .get(`/api/providers/${providerId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        it('Error 404: ID no encontrado', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/providers/${fakeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        it('Unitario: Rol "lider" intenta ver proveedor inactivo (403)', async () => {
            const req = { 
                userRole: 'lider', 
                params: { id: 'someId' } 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            // Mockeamos que la DB devuelve un proveedor con status 'inactivo'
            const mockFind = jest.spyOn(Provider, 'findById').mockReturnValue({
                populate: jest.fn().mockResolvedValue({ status: 'inactivo' })
            });

            await providerController.getProviderById(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/no tienes permiso/i)
            }));
            mockFind.mockRestore();
        });

        it('Error 500: Fallo DB', async () => {
            const mockFind = jest.spyOn(Provider, 'findById')
                .mockImplementationOnce(() => ({
                    populate: jest.fn().mockRejectedValue(new Error("Error DB"))
                }));
            
            const res = await request(app)
                .get(`/api/providers/${providerId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            mockFind.mockRestore();
        });
    });

    // =================================================================
    // 4. UPDATE (PUT)
    // =================================================================
    describe('PUT /api/providers/:id', () => {
        it('Coordinador actualiza datos básicos', async () => {
            const res = await request(app)
                .put(`/api/providers/${providerId}`)
                .set('x-access-token', tokenCoordinador)
                .send({ contactPerson: "Nuevo Contacto" });
            expect(res.statusCode).toBe(200);
            expect(res.body.data.contactPerson).toBe("Nuevo Contacto");
        });

        it('Error 403: Coordinador intenta cambiar status', async () => {
            const res = await request(app)
                .put(`/api/providers/${providerId}`)
                .set('x-access-token', tokenCoordinador)
                .send({ status: 'inactivo' });
            expect(res.statusCode).toBe(403);
        });

        it('Error 403: Usuario no permitido', async () => {
            const req = { userRole: 'invitado', body: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            // Usamos helper o mock para probar la validación inicial
            await providerController.updateProvider(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('Error 404: Tipo de proveedor invalido en update', async () => {
             const fakeTypeId = new mongoose.Types.ObjectId();
             const res = await request(app)
                .put(`/api/providers/${providerId}`)
                .set('x-access-token', tokenAdmin)
                .send({ providerType: fakeTypeId });
             expect(res.statusCode).toBe(404);
             expect(res.body.message).toMatch(/tipo de proveedor.*no existe/i);
        });

        it('Error 404: Proveedor a actualizar no existe', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
               .put(`/api/providers/${fakeId}`)
               .set('x-access-token', tokenAdmin)
               .send({ name: "Fantasma" });
            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Proveedor no encontrado");
       });

        it('Error 500: Fallo DB en Update', async () => {
            const mockUpdate = jest.spyOn(Provider, 'findByIdAndUpdate')
                .mockImplementationOnce(() => ({
                    populate: jest.fn().mockRejectedValue(new Error("Error Update"))
                }));
            
            const res = await request(app)
                .put(`/api/providers/${providerId}`)
                .set('x-access-token', tokenAdmin)
                .send({ name: "Error" });
            
            expect(res.statusCode).toBe(500);
            mockUpdate.mockRestore();
        });
    });

    // =================================================================
    // 5. DELETE (DELETE)
    // =================================================================
    describe('DELETE /api/providers/:id', () => {
        it('Error 403: Coordinador intenta eliminar', async () => {
            const res = await request(app)
                .delete(`/api/providers/${providerId}`)
                .set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(403);
        });

        it('Error 400: No se puede eliminar si tiene contratos (Mocked)', async () => {
            // Simulamos que Contract.findOne encuentra algo
            const mockContractFind = jest.spyOn(Contract, 'findOne')
                                         .mockResolvedValue({ _id: 'contrato123' });

            const res = await request(app)
                .delete(`/api/providers/${providerId}`)
                .set('x-access-token', tokenAdmin);
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/asignado a uno o más contratos/i);
            
            mockContractFind.mockRestore();
        });

        it('Admin elimina proveedor exitosamente', async () => {
            // Aseguramos que Contract.findOne devuelva null (sin contratos)
            const mockContractFind = jest.spyOn(Contract, 'findOne')
                                         .mockResolvedValue(null);

            const res = await request(app)
                .delete(`/api/providers/${providerId}`)
                .set('x-access-token', tokenAdmin);
            
            expect(res.statusCode).toBe(200);
            mockContractFind.mockRestore();
        });

        it('Error 404: Ya eliminado', async () => {
             // Contract find retorna null
             const mockContractFind = jest.spyOn(Contract, 'findOne').mockResolvedValue(null);

            const res = await request(app)
                .delete(`/api/providers/${providerId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
            
            mockContractFind.mockRestore();
        });

        it('Error 500: Fallo DB en Delete', async () => {
             // Forzamos error en Contract.findOne para variar, o en Provider.findByIdAndDelete
             const mockDel = jest.spyOn(Provider, 'findByIdAndDelete')
                                 .mockRejectedValue(new Error("Error Delete"));
             // Debemos mockear contrato null para pasar la primera validacion
             const mockContractFind = jest.spyOn(Contract, 'findOne').mockResolvedValue(null);

             const fakeId = new mongoose.Types.ObjectId();
             const res = await request(app)
                .delete(`/api/providers/${fakeId}`)
                .set('x-access-token', tokenAdmin);
            
            expect(res.statusCode).toBe(500);
            
            mockDel.mockRestore();
            mockContractFind.mockRestore();
        });
    });

});