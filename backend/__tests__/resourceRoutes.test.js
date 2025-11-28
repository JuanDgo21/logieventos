const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); 
const User = require('../models/User');
const Resource = require('../models/Resource');
const ResourceType = require('../models/ResourceType');
const Contract = require('../models/Contract'); 

// Importamos el controlador para las pruebas unitarias (White Box)
const controller = require('../controllers/resourceControllers');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let tokenLider = ''; 
let resourceTypeId = ''; 
let resourceId = '';

const adminUser = {
    document: 14141414,
    fullname: "Admin Resource",
    username: "admin_res",
    email: "admin_r@test.com",
    password: "password123",
    role: "admin"
};

const coordUser = {
    document: 15151515,
    fullname: "Coord Resource",
    username: "coord_res",
    email: "coord_r@test.com",
    password: "password123",
    role: "coordinador"
};

const liderUser = {
    document: 16161616,
    fullname: "Lider Resource",
    username: "lider_res",
    email: "lider_r@test.com",
    password: "password123",
    role: "lider"
};

const resourcePrueba = {
    name: "Silla Tiffany Dorada",
    description: "Silla elegante para bodas",
    quantity: 100,
    cost: 5000,
    status: "disponible"
};

describe('Pruebas de Integración y Unitarias: Gestión de Recursos (100%)', () => {

    beforeAll(async () => {
        const testDB = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/logieventos_test';
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(testDB);
        }
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email, liderUser.email] } });
        await Resource.deleteMany({});
        await ResourceType.deleteMany({});
        await Contract.deleteMany({});

        await new User(adminUser).save();
        await new User(coordUser).save();
        await new User(liderUser).save();

        const tipo = await new ResourceType({
            name: "Mobiliario Test",
            description: "Muebles para eventos",
            createdBy: new mongoose.Types.ObjectId()
        }).save();
        resourceTypeId = tipo._id;
    });

    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email, liderUser.email] } });
        await Resource.deleteMany({});
        await ResourceType.deleteMany({});
        await Contract.deleteMany({});
        await mongoose.connection.close();
    });

    it('Debería loguearse y obtener tokens', async () => {
        const resAdmin = await request(app).post('/api/auth/signin').send({ email: adminUser.email, password: adminUser.password });
        tokenAdmin = resAdmin.body.token;
        const resCoord = await request(app).post('/api/auth/signin').send({ email: coordUser.email, password: coordUser.password });
        tokenCoordinador = resCoord.body.token;
        const resLider = await request(app).post('/api/auth/signin').send({ email: liderUser.email, password: liderUser.password });
        tokenLider = resLider.body.token;
        expect(resAdmin.statusCode).toBe(200);
    });

    // =========================================================================
    // BLOQUE 1: CREACIÓN (POST)
    // =========================================================================
    
    it('POST /api/resources - Error 403 (Lider)', async () => {
        const res = await request(app).post('/api/resources').set('x-access-token', tokenLider).send(resourcePrueba);
        expect(res.statusCode).toBe(403);
    });

    it('POST /api/resources - Error 404 Tipo inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).post('/api/resources').set('x-access-token', tokenAdmin).send({ ...resourcePrueba, resourceType: fakeId });
        expect(res.statusCode).toBe(404);
    });

    it('POST /api/resources - Admin crea Recurso', async () => {
        const res = await request(app).post('/api/resources').set('x-access-token', tokenAdmin).send({ ...resourcePrueba, resourceType: resourceTypeId });
        expect(res.statusCode).toBe(201);
        resourceId = res.body.data._id;
    });

    it('POST /api/resources - Error 400 duplicado', async () => {
        const res = await request(app).post('/api/resources').set('x-access-token', tokenAdmin).send({ ...resourcePrueba, resourceType: resourceTypeId });
        expect(res.statusCode).toBe(400);
    });

    // =========================================================================
    // BLOQUE 2: LISTAR (GET)
    // =========================================================================

    it('GET /api/resources - Listar paginado', async () => {
        const res = await request(app).get('/api/resources?page=1&limit=5').set('x-access-token', tokenCoordinador);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/resources - Líder no ve mantenimiento', async () => {
        await Resource.create({
            name: "Mesa Rota Test", description: "No usar", quantity: 1, cost: 100, status: "mantenimiento",
            resourceType: resourceTypeId, createdBy: new mongoose.Types.ObjectId()
        });
        const res = await request(app).get('/api/resources').set('x-access-token', tokenLider);
        const encontrado = res.body.data.find(r => r.name === "Mesa Rota Test");
        expect(encontrado).toBeUndefined();
    });

    // =========================================================================
    // BLOQUE 3: OBTENER POR ID (GET /:id)
    // =========================================================================

    it('GET /api/resources/:id - Admin ve recurso disponible', async () => {
        const res = await request(app).get(`/api/resources/${resourceId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toBe(resourcePrueba.name);
    });

    it('GET /api/resources/:id - Admin ve recurso mantenimiento', async () => {
        // Creamos recurso mantenimiento
        const mant = await Resource.create({
            name: "Solo Admin Ve", description: "...", quantity: 1, cost: 1, status: "mantenimiento",
            resourceType: resourceTypeId, createdBy: new mongoose.Types.ObjectId()
        });
        const res = await request(app).get(`/api/resources/${mant._id}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    it('GET /api/resources/:id - Líder NO ve recurso mantenimiento', async () => {
        // Buscamos el recurso de mantenimiento creado arriba
        const mant = await Resource.findOne({ name: "Solo Admin Ve" });
        const res = await request(app).get(`/api/resources/${mant._id}`).set('x-access-token', tokenLider);
        expect(res.statusCode).toBe(403);
    });

    it('GET /api/resources/:id - Error 404 no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/resources/${fakeId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(404);
    });

    // =========================================================================
    // BLOQUE 4: BÚSQUEDA
    // =========================================================================

    it('GET /api/resources/search - Busca por nombre', async () => {
        const res = await request(app).get('/api/resources/search?query=Silla').set('x-access-token', tokenCoordinador);
        expect(res.statusCode).toBe(200);
    });

    it('GET /api/resources/search - Error 400 query corto', async () => {
        const res = await request(app).get('/api/resources/search?query=si').set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(400);
    });

    // =========================================================================
    // BLOQUE 5: ACTUALIZACIÓN (PUT)
    // =========================================================================

    it('PUT /api/resources/:id - Coordinador actualiza', async () => {
        const res = await request(app).put(`/api/resources/${resourceId}`).set('x-access-token', tokenCoordinador).send({ quantity: 150 });
        expect(res.statusCode).toBe(200);
    });

    it('PUT /api/resources/:id - Coordinador NO cambia status', async () => {
        const res = await request(app).put(`/api/resources/${resourceId}`).set('x-access-token', tokenCoordinador).send({ status: 'mantenimiento' });
        expect(res.statusCode).toBe(403);
    });

    it('PUT /api/resources/:id - Error 404 Tipo inexistente', async () => {
        const fakeTypeId = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/resources/${resourceId}`).set('x-access-token', tokenAdmin).send({ resourceType: fakeTypeId });
        expect(res.statusCode).toBe(404);
    });

    it('PUT /api/resources/:id - Error 404 Recurso no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/resources/${fakeId}`).set('x-access-token', tokenAdmin).send({ name: "Fantasma" });
        expect(res.statusCode).toBe(404);
    });

    // =========================================================================
    // BLOQUE 6: ELIMINACIÓN (DELETE)
    // =========================================================================

    it('DELETE /api/resources/:id - Coordinador NO elimina', async () => {
        const res = await request(app).delete(`/api/resources/${resourceId}`).set('x-access-token', tokenCoordinador);
        expect(res.statusCode).toBe(403);
    });

    it('DELETE /api/resources/:id - Bloqueo contrato', async () => {
        const spy = jest.spyOn(Contract, 'findOne').mockResolvedValue({ _id: 'dummy_contract_id' });
        const res = await request(app).delete(`/api/resources/${resourceId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(400);
        spy.mockRestore();
    });

    it('DELETE /api/resources/:id - Admin elimina', async () => {
        const res = await request(app).delete(`/api/resources/${resourceId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    it('DELETE /api/resources/:id - Error 404', async () => {
        const res = await request(app).delete(`/api/resources/${resourceId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(404);
    });

    // =========================================================================
    // BLOQUE PRUEBAS UNITARIAS (WHITE BOX - COBERTURA TOTAL)
    // =========================================================================
    
    describe('Pruebas Unitarias Avanzadas (Cobertura Total)', () => {
        
        const mockResponse = () => {
            const res = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            return res;
        };

        const mockRequest = (body, userRole, params = {}, query = {}) => ({
            body, userRole, params, query, userId: new mongoose.Types.ObjectId()
        });

        // Helper para simular cadenas de Mongoose
        const mockQuery = (result) => {
            const query = {};
            query.populate = jest.fn().mockReturnValue(query);
            query.limit = jest.fn().mockReturnValue(query);
            query.skip = jest.fn().mockReturnValue(query);
            query.sort = jest.fn().mockReturnValue(query);
            query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
            return query;
        };

        afterEach(() => {
            jest.restoreAllMocks();
        });

        // --- VALIDACIONES PREVIAS ---
        it('updateResource: Fallo si req.body es undefined', async () => {
            const req = mockRequest(undefined, 'admin');
            const res = mockResponse();
            await controller.updateResource(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('updateResource: Fallo rol incorrecto', async () => {
            const req = mockRequest({}, 'lider');
            const res = mockResponse();
            await controller.updateResource(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('createResource: Fallo rol incorrecto', async () => {
            const req = mockRequest({}, 'lider');
            const res = mockResponse();
            await controller.createResource(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('deleteResource: Fallo rol incorrecto', async () => {
            const req = mockRequest({}, 'coordinador');
            const res = mockResponse();
            await controller.deleteResource(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        // --- COBERTURA LÍNEAS 169 y 187 (RAMAS) ---
        it('getResourceById: Éxito Admin (Unitario)', async () => {
            const req = mockRequest({}, 'admin', { id: '507f1f77bcf86cd799439011' });
            const res = mockResponse();
            const mockResource = { status: 'mantenimiento', _id: '507f1f77bcf86cd799439011' };

            jest.spyOn(Resource, 'findById').mockImplementation(() => mockQuery(mockResource));

            await controller.getResourceById(req, res);
            expect(Resource.findById).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Este test cubre el caso donde Lider SI tiene permiso (rama else de la validación)
        it('getResourceById: Éxito Lider (Unitario)', async () => {
            const req = mockRequest({}, 'lider', { id: '507f1f77bcf86cd799439011' });
            const res = mockResponse();
            const mockResource = { status: 'disponible', _id: '507f1f77bcf86cd799439011' };

            jest.spyOn(Resource, 'findById').mockImplementation(() => mockQuery(mockResource));

            await controller.getResourceById(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Este test cubre el caso donde Lider NO tiene permiso (rama if)
        it('getResourceById: Bloqueo Lider (Unitario)', async () => {
            const req = mockRequest({}, 'lider', { id: '507f1f77bcf86cd799439011' });
            const res = mockResponse();
            const mockResource = { status: 'mantenimiento' };

            jest.spyOn(Resource, 'findById').mockImplementation(() => mockQuery(mockResource));

            await controller.getResourceById(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/No tienes permiso/) }));
        });

        // --- COBERTURA LÍNEA 284 (UPDATE SUCCESS) ---
        it('updateResource: Ejecución exitosa de findByIdAndUpdate (Unitario)', async () => {
            const req = mockRequest(
                { name: "UpdateTest" }, 
                'admin', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();
            const mockUpdated = { _id: '507f1f77bcf86cd799439011', name: "UpdateTest" };

            jest.spyOn(ResourceType, 'findById').mockResolvedValue({ _id: 'type1' });
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => mockQuery(mockUpdated));

            await controller.updateResource(req, res);

            expect(Resource.findByIdAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // --- TESTS ADICIONALES PARA BRANCH COVERAGE ---
        it('updateResource: Coordinador actualiza sin status - Éxito', async () => {
            const req = mockRequest(
                { name: "Solo nombre", description: "Nueva descripción" }, // Sin status
                'coordinador', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();
            const mockUpdated = { _id: '507f1f77bcf86cd799439011', name: "Solo nombre" };

            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => mockQuery(mockUpdated));

            await controller.updateResource(req, res);

            expect(Resource.findByIdAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('updateResource: Admin actualiza sin resourceType - Éxito', async () => {
            const req = mockRequest(
                { name: "Update sin tipo", quantity: 50 }, // Sin resourceType
                'admin', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();
            const mockUpdated = { _id: '507f1f77bcf86cd799439011', name: "Update sin tipo" };

            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => mockQuery(mockUpdated));

            await controller.updateResource(req, res);

            expect(Resource.findByIdAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('updateResource: Body vacío objeto pero sin campos', async () => {
            const req = mockRequest({}, 'admin', { id: '507f1f77bcf86cd799439011' }); // Body = {}
            const res = mockResponse();
            const mockUpdated = { _id: '507f1f77bcf86cd799439011' };

            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => mockQuery(mockUpdated));

            await controller.updateResource(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        // --- TESTS PARA 100% COVERAGE ---
        it('updateResource: Error 500 que NO es duplicado', async () => {
            const req = mockRequest(
                { name: "ErrorTest" }, 
                'admin', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();

            // Mock para validación exitosa
            jest.spyOn(ResourceType, 'findById').mockResolvedValue({ _id: 'type1' });
            
            // Mock error que NO es duplicado (código diferente de 11000)
            const generalError = new Error('General Database Error');
            generalError.code = 500; // Cualquier código que no sea 11000
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => {
                throw generalError;
            });

            await controller.updateResource(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Error al actualizar recurso'
            }));
        });

        it('updateResource: Construye con todos los campos', async () => {
            const req = mockRequest(
                {
                    name: "Test Name",
                    description: "Test Description", 
                    quantity: 10,
                    cost: 100,
                    resourceType: "type123",
                    status: "mantenimiento"
                }, 
                'admin', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();
            const mockUpdated = { 
                _id: '507f1f77bcf86cd799439011', 
                name: "Test Name",
                description: "Test Description",
                quantity: 10,
                cost: 100,
                resourceType: "type123", 
                status: "mantenimiento"
            };

            jest.spyOn(ResourceType, 'findById').mockResolvedValue({ _id: 'type123' });
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => mockQuery(mockUpdated));

            await controller.updateResource(req, res);

            expect(Resource.findByIdAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('searchResources: Líder aplica filtro disponible', async () => {
            const req = mockRequest(
                {}, 
                'lider', 
                {}, 
                { query: 'test' }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Test Resource 1', status: 'disponible' },
                { _id: '2', name: 'Test Resource 2', status: 'disponible' }
            ];

            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                // Verificar que el filtro incluya status: 'disponible' para líder
                expect(filter.status).toBe('disponible');
                return mockQuery(mockResources);
            });

            await controller.searchResources(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('searchResources: Admin NO aplica filtro disponible', async () => {
            const req = mockRequest(
                {}, 
                'admin', 
                {}, 
                { query: 'test' }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Test Resource 1', status: 'mantenimiento' },
                { _id: '2', name: 'Test Resource 2', status: 'disponible' }
            ];

            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                // Verificar que el filtro NO incluya status para admin
                expect(filter.status).toBeUndefined();
                return mockQuery(mockResources);
            });

            await controller.searchResources(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('getAllResources: Coordinador NO aplica filtro disponible', async () => {
            const req = mockRequest(
                {}, 
                'coordinador', 
                {}, 
                { page: 1, limit: 10 }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Resource 1', status: 'mantenimiento' },
                { _id: '2', name: 'Resource 2', status: 'disponible' }
            ];

            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                // Verificar que el filtro NO incluya status para coordinador
                expect(filter.status).toBeUndefined();
                return mockQuery(mockResources);
            });

            jest.spyOn(Resource, 'countDocuments').mockResolvedValue(2);

            await controller.getAllResources(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('createResource: Error 500 general (no duplicado)', async () => {
            const req = mockRequest(
                {
                    name: "Test Error",
                    description: "Test Description",
                    quantity: 10,
                    cost: 100,
                    resourceType: "type123"
                },
                'admin'
            );
            const res = mockResponse();

            jest.spyOn(ResourceType, 'findById').mockResolvedValue({ _id: 'type123' });
            
            const generalError = new Error('General Save Error');
            generalError.code = 500;
            jest.spyOn(Resource.prototype, 'save').mockImplementation(() => {
                throw generalError;
            });

            await controller.createResource(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

                // === TESTS ESPECÍFICOS PARA LÍNEAS NO CUBIERTAS ===
        
        it('handleResourceUpdateError: Ejecuta res.status(500) para error general', async () => {
            const req = mockRequest(
                { name: "GeneralErrorTest" }, 
                'admin', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();

            // Mock para validación exitosa
            jest.spyOn(ResourceType, 'findById').mockResolvedValue({ _id: 'type1' });
            
            // Mock error general (sin código 11000)
            const generalError = new Error('General Database Connection Error');
            // NO establecer error.code para que sea un error general
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => {
                throw generalError;
            });

            await controller.updateResource(req, res);

            // Verificar que se llamó a res.status(500) - esta es la línea 71
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Error al actualizar recurso'
            }));
        });

        it('getAllResources: Líder aplica filtro disponible en unit test', async () => {
            const req = mockRequest(
                {}, 
                'lider', 
                {}, 
                { page: 1, limit: 10 }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Resource 1', status: 'disponible' },
                { _id: '2', name: 'Resource 2', status: 'disponible' }
            ];

            let capturedFilter = {};
            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                capturedFilter = filter; // Capturamos el filtro aplicado
                return mockQuery(mockResources);
            });

            jest.spyOn(Resource, 'countDocuments').mockResolvedValue(2);

            await controller.getAllResources(req, res);

            // Verificar que el filtro incluya status: 'disponible' para líder
            expect(capturedFilter.status).toBe('disponible');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('getAllResources: Admin NO aplica filtro disponible en unit test', async () => {
            const req = mockRequest(
                {}, 
                'admin', 
                {}, 
                { page: 1, limit: 10, status: 'mantenimiento' }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Resource 1', status: 'mantenimiento' },
                { _id: '2', name: 'Resource 2', status: 'disponible' }
            ];

            let capturedFilter = {};
            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                capturedFilter = filter;
                return mockQuery(mockResources);
            });

            jest.spyOn(Resource, 'countDocuments').mockResolvedValue(2);

            await controller.getAllResources(req, res);

            // Verificar que el filtro NO sobreescribe el status para admin
            expect(capturedFilter.status).toBe('mantenimiento'); // Mantiene el filtro original
            expect(res.status).toHaveBeenCalledWith(200);
        });

                // =========================================================================
        // TESTS ESPECÍFICOS PARA LÍNEAS EXACTAS NO CUBIERTAS
        // =========================================================================

        it('updateResource: Error general (NO duplicado) ejecuta res.status(500)', async () => {
            const req = mockRequest(
                { name: "TestError" }, 
                'admin', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();

            // Mock para que pase la validación
            jest.spyOn(ResourceType, 'findById').mockResolvedValue({ _id: 'type1' });
            
            // Mock error que NO es duplicado (sin código 11000)
            const generalError = new Error('Random database failure');
            // IMPORTANTE: NO establecer error.code para forzar el camino del error general
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => {
                throw generalError;
            });

            await controller.updateResource(req, res);

            // Esto prueba específicamente la línea 71: res.status(500).json({
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error al actualizar recurso',
                error: 'Random database failure'
            });
        });

        it('getAllResources: Verifica que líder SI aplica filter.status = disponible', async () => {
            const req = mockRequest(
                {}, 
                'lider',  // Rol LIDER - esto activa la condición
                {}, 
                { page: 1, limit: 5 }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Recurso 1', status: 'disponible' }
            ];

            let capturedFilter = {};
            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                capturedFilter = filter; // Capturamos el filtro que se aplica
                return mockQuery(mockResources);
            });

            jest.spyOn(Resource, 'countDocuments').mockResolvedValue(1);

            await controller.getAllResources(req, res);

            // Esto prueba específicamente la línea 89: if (req.userRole === 'lider')
            // Y la línea 90: filter.status = 'disponible';
            expect(capturedFilter.status).toBe('disponible');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('getAllResources: Verifica que coordinador NO aplica filter.status = disponible', async () => {
            const req = mockRequest(
                {}, 
                'coordinador',  // Rol COORDINADOR - NO debe aplicar filtro
                {}, 
                { page: 1, limit: 5, status: 'mantenimiento' }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Recurso 1', status: 'mantenimiento' }
            ];

            let capturedFilter = {};
            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                capturedFilter = filter;
                return mockQuery(mockResources);
            });

            jest.spyOn(Resource, 'countDocuments').mockResolvedValue(1);

            await controller.getAllResources(req, res);

            // Coordinador debe mantener el filtro original, NO aplicar 'disponible'
            expect(capturedFilter.status).toBe('mantenimiento');
            expect(res.status).toHaveBeenCalledWith(200);
        });

                // =========================================================================
        // TEST PARA handleResourceUpdateError (LÍNEA 77)
        // =========================================================================

        it('updateResource: Error duplicado ejecuta handleResourceUpdateError', async () => {
            const req = mockRequest(
                { name: "TestDuplicate" }, 
                'admin', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();

            // Mock para que pase la validación
            jest.spyOn(ResourceType, 'findById').mockResolvedValue({ _id: 'type1' });
            
            // Mock error de DUPLICADO (código 11000)
            const duplicateError = new Error('Duplicate key error');
            duplicateError.code = 11000;
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => {
                throw duplicateError;
            });

            await controller.updateResource(req, res);

            // Esto prueba que handleResourceUpdateError se ejecuta (línea 77)
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ya existe un recurso con ese nombre',
                field: 'name'
            });
        });

    // =========================================================================
    // ERRORES 500 (MOCKS) - VERSIÓN CORREGIDA
    // =========================================================================
    describe('Errores 500', () => {
        afterEach(() => jest.restoreAllMocks());

        it('GET /api/resources - Error 500', async () => {
            jest.spyOn(Resource, 'find').mockImplementation(() => { 
                throw new Error('DB Error'); 
            });
            const res = await request(app).get('/api/resources').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
        });

        it('POST /api/resources - Error 500', async () => {
            jest.spyOn(Resource.prototype, 'save').mockImplementation(() => { 
                throw new Error('Save Error'); 
            });
            const res = await request(app).post('/api/resources').set('x-access-token', tokenAdmin).send({ ...resourcePrueba, name: "Crash", resourceType: resourceTypeId });
            expect(res.statusCode).toBe(500);
        });

        it('PUT /api/resources/:id - Error 500', async () => {
            const dummyId = new mongoose.Types.ObjectId();
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => { 
                throw new Error('Update Error'); 
            });
            const res = await request(app).put(`/api/resources/${dummyId}`).set('x-access-token', tokenAdmin).send({ name: "Fail" });
            expect(res.statusCode).toBe(500);
        });

        it('DELETE /api/resources/:id - Error 500', async () => {
            jest.spyOn(Contract, 'findOne').mockResolvedValue(null);
            jest.spyOn(Resource, 'findByIdAndDelete').mockImplementation(() => { 
                throw new Error('Delete Error'); 
            });
            const res = await request(app).delete(`/api/resources/${new mongoose.Types.ObjectId()}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
        });

        it('GET /api/resources/search - Error 500', async () => {
            jest.spyOn(Resource, 'find').mockImplementation(() => { 
                throw new Error('Search Error'); 
            });
            const res = await request(app).get('/api/resources/search?query=Test').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
        });
    });

            // =========================================================================
        // TESTS PARA LÍNEAS ESPECÍFICAS NO CUBIERTAS
        // =========================================================================

        it('updateResource: Error duplicado - cubre handleResourceUpdateError declaration', async () => {
            const req = mockRequest(
                { name: "DuplicateTest" }, 
                'admin', 
                { id: '507f1f77bcf86cd799439011' }
            );
            const res = mockResponse();

            // Mock para que pase la validación
            jest.spyOn(ResourceType, 'findById').mockResolvedValue({ _id: 'type1' });
            
            // Mock error de DUPLICADO (código 11000) - esto ejecuta handleResourceUpdateError
            const duplicateError = new Error('E11000 duplicate key error');
            duplicateError.code = 11000; // Esto activa el if (error.code === 11000)
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => {
                throw duplicateError;
            });

            await controller.updateResource(req, res);

            // Esto prueba que handleResourceUpdateError se ejecuta (línea 77)
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Ya existe un recurso con ese nombre',
                field: 'name'
            }));
        });

        it('getAllResources: Líder fuerza filter.status = disponible', async () => {
            const req = mockRequest(
                {}, 
                'lider', // Esto activa if (req.userRole === 'lider')
                {}, 
                { page: 1, limit: 10 }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Test Resource', status: 'disponible' }
            ];

            // Capturamos el filtro que se pasa a Resource.find
            let actualFilter = {};
            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                actualFilter = { ...filter }; // Guardamos una copia del filtro
                return mockQuery(mockResources);
            });

            jest.spyOn(Resource, 'countDocuments').mockResolvedValue(1);

            await controller.getAllResources(req, res);

            // Verificar que la línea 89 se ejecutó: filter.status = 'disponible'
            expect(actualFilter.status).toBe('disponible');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('getAllResources: Admin NO ejecuta filter.status para líder', async () => {
            const req = mockRequest(
                {}, 
                'admin', // Esto NO activa if (req.userRole === 'lider')
                {}, 
                { page: 1, limit: 10, status: 'mantenimiento' }
            );
            const res = mockResponse();

            const mockResources = [
                { _id: '1', name: 'Test Resource', status: 'mantenimiento' }
            ];

            let actualFilter = {};
            jest.spyOn(Resource, 'find').mockImplementation((filter) => {
                actualFilter = { ...filter };
                return mockQuery(mockResources);
            });

            jest.spyOn(Resource, 'countDocuments').mockResolvedValue(1);

            await controller.getAllResources(req, res);

            // Admin debe mantener el status original, NO 'disponible'
            expect(actualFilter.status).toBe('mantenimiento');
            expect(res.status).toHaveBeenCalledWith(200);
        });
});

});