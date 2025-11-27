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
    // BLOQUE 3: OBTENER POR ID (GET /:id) - ¡ESTE FALTABA!
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
        // Este test asegura que la línea 169 (await Resource.findById) se marque cubierta
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
    });

    // =========================================================================
    // ERRORES 500 (MOCKS)
    // =========================================================================
    describe('Errores 500', () => {
        afterEach(() => jest.restoreAllMocks());

        it('GET /api/resources - Error 500', async () => {
            jest.spyOn(Resource, 'find').mockImplementation(() => { throw new Error('DB Error'); });
            const res = await request(app).get('/api/resources').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
        });

        it('POST /api/resources - Error 500', async () => {
            jest.spyOn(Resource.prototype, 'save').mockImplementation(() => { throw new Error('Save Error'); });
            const res = await request(app).post('/api/resources').set('x-access-token', tokenAdmin).send({ ...resourcePrueba, name: "Crash", resourceType: resourceTypeId });
            expect(res.statusCode).toBe(500);
        });

        it('PUT /api/resources/:id - Error 500', async () => {
            const dummyId = new mongoose.Types.ObjectId();
            jest.spyOn(Resource, 'findByIdAndUpdate').mockImplementation(() => { throw new Error('Update Error'); });
            const res = await request(app).put(`/api/resources/${dummyId}`).set('x-access-token', tokenAdmin).send({ name: "Fail" });
            expect(res.statusCode).toBe(500);
        });

        it('DELETE /api/resources/:id - Error 500', async () => {
            jest.spyOn(Contract, 'findOne').mockResolvedValue(null);
            jest.spyOn(Resource, 'findByIdAndDelete').mockImplementation(() => { throw new Error('Delete Error'); });
            const res = await request(app).delete(`/api/resources/${new mongoose.Types.ObjectId()}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
        });

        it('GET /api/resources/search - Error 500', async () => {
            jest.spyOn(Resource, 'find').mockImplementation(() => { throw new Error('Search Error'); });
            const res = await request(app).get('/api/resources/search?query=Test').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
        });
    });
});