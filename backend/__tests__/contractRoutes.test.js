const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Importar TODOS los modelos necesarios
const User = require('../models/User');
const Contract = require('../models/Contract');
const Resource = require('../models/Resource');
const ResourceType = require('../models/ResourceType');
const Provider = require('../models/Provider');
const ProviderType = require('../models/ProviderType');
const Personnel = require('../models/Personnel');
const PersonnelType = require('../models/PersonnelType');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let contractId = '';
let adminId = '';

// Variables para IDs de dependencias
let resourceId = '';
let providerId = '';
let personnelId = '';

// 1. Datos Usuarios
const adminUser = {
    document: 91919191,
    fullname: "Admin Contract",
    username: "admin_contract",
    email: "admin_c@test.com",
    password: "password123",
    role: "admin"
};

const coordUser = {
    document: 92929292,
    fullname: "Coord Contract",
    username: "coord_contract",
    email: "coord_c@test.com",
    password: "password123",
    role: "coordinador"
};

// Objeto base para contratos (Evita errores de "is defined")
const baseContractData = {
    clientName: "Cliente Base",
    clientEmail: "base@test.com",
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    budget: 1000
};

describe('Pruebas de Integración: Gestión de Contratos (FULL)', () => {

    // --- SETUP COMPLETO ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // 1. Limpieza Total
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Contract.deleteMany({});
        await Resource.deleteMany({});
        await ResourceType.deleteMany({});
        await Provider.deleteMany({});
        await ProviderType.deleteMany({});
        await Personnel.deleteMany({});
        await PersonnelType.deleteMany({});

        // 2. Asegurar índices principales
        await Contract.createIndexes();

        // 3. Crear Usuarios
        const admin = await new User(adminUser).save();
        const coord = await new User(coordUser).save();
        adminId = admin._id;

        // 4. CREAR EL ECOSISTEMA (Dependencias)
        
        // A. Recurso
        const resType = await new ResourceType({ name: "Tipo C-Res", createdBy: admin._id }).save();
        const resource = await new Resource({
            name: "Silla VIP", quantity: 100, cost: 10000, resourceType: resType._id, createdBy: admin._id
        }).save();
        resourceId = resource._id;

        // B. Proveedor
        const provType = await new ProviderType({ name: "Tipo C-Prov", createdBy: admin._id }).save();
        const provider = await new Provider({
            name: "Sonido Pro", email: "c-prov@test.com", providerType: provType._id
        }).save();
        providerId = provider._id;

        // C. Personal
        const persType = await new PersonnelType({ name: "Tipo C-Pers", createdBy: admin._id }).save();
        const person = await new Personnel({
            firstName: "Juan", lastName: "Contract", email: "c-pers@test.com", personnelType: persType._id
        }).save();
        personnelId = person._id;
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await Contract.deleteMany({});
        await mongoose.connection.close();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
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

    // ==================================================
    // 1. CREAR (CREATE)
    // ==================================================

    it('POST /api/contracts - Admin crea Contrato Completo', async () => {
        const contractData = {
            name: "Boda Real 2025",
            clientName: "Familia Real",
            clientEmail: "boda@realeza.com",
            clientPhone: "3001234567",
            startDate: "2025-06-01",
            endDate: "2025-06-02",
            budget: 5000000,
            resources: [{ resource: resourceId, quantity: 50 }],
            providers: [{ provider: providerId, cost: 200000 }],
            personnel: [{ person: personnelId, hours: 8, role: "Mesero" }]
        };
        const res = await request(app).post('/api/contracts').set('x-access-token', tokenAdmin).send(contractData);
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        contractId = res.body.data._id;
    });

    it('POST /api/contracts - Éxito: Crear sin personal/recursos (Arrays vacíos)', async () => {
        const contractNoArrays = { 
            ...baseContractData, 
            name: "Contract Empty Arrays", 
            personnel: [], 
            resources: [], 
            providers: [] 
        };
        const res = await request(app).post('/api/contracts').set('x-access-token', tokenAdmin).send(contractNoArrays);
        expect(res.statusCode).toBe(201);
    });

    it('POST /api/contracts - Fallo: Recurso inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).post('/api/contracts').set('x-access-token', tokenAdmin).send({
            ...baseContractData, name: "Res Fail", resources: [{ resource: fakeId, quantity: 1 }]
        });
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/recurso.*no existe/i);
    });

    it('POST /api/contracts - Fallo: Proveedor inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).post('/api/contracts').set('x-access-token', tokenAdmin).send({
            ...baseContractData, name: "Prov Fail", providers: [{ provider: fakeId, cost: 100 }]
        });
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/proveedor.*no existe/i);
    });

    it('POST /api/contracts - Fallo: Personal inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).post('/api/contracts').set('x-access-token', tokenAdmin).send({
            ...baseContractData, name: "Pers Fail", personnel: [{ person: fakeId, role: "X", hours: 1 }]
        });
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/personal.*no existe/i);
    });

    // ==================================================
    // 2. LEER (READ)
    // ==================================================

    it('GET /api/contracts - Listar contratos', async () => {
        const res = await request(app).get('/api/contracts').set('x-access-token', tokenCoordinador);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/contracts/search - Buscar por nombre', async () => {
        const res = await request(app).get('/api/contracts/search?name=Boda').set('x-access-token', tokenCoordinador);
        expect(res.statusCode).toBe(200);
        expect(res.body.data[0].name).toContain("Boda");
    });

    it('GET /api/contracts/:id/report - Generar reporte financiero normal', async () => {
        const res = await request(app).get(`/api/contracts/${contractId}/report`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.grandTotal).toBeGreaterThan(0);
    });

    // ---> NUEVO: Cubrir líneas 214-233 (Count by Status - Happy Path)
    it('GET /api/contracts/count-by-status - Éxito: Contar por estado', async () => {
        // Crear contratos extra con diferentes estados para que el reduce trabaje
        await new Contract({ ...baseContractData, name: "C-Draft", status: "borrador", createdBy: adminId }).save();
        await new Contract({ ...baseContractData, name: "C-Active", status: "activo", createdBy: adminId }).save();

        const res = await request(app).get('/api/contracts/count-by-status').set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        // Verificar que el objeto tenga claves
        expect(Object.keys(res.body.data).length).toBeGreaterThan(0);
    });

    // ---> NUEVO: Reporte con arrays vacíos (para cubrir reduce inicial con 0)
    it('GET /api/contracts/:id/report - Reporte con arrays vacíos', async () => {
        const emptyContract = await new Contract({
            ...baseContractData,
            name: "Contrato Vacio Report",
            createdBy: adminId,
            resources: [],
            providers: [],
            personnel: []
        }).save();

        const res = await request(app).get(`/api/contracts/${emptyContract._id}/report`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.grandTotal).toBe(0);
    });

    // ---> NUEVO: Reporte con Referencias Rotas (Null checks en reduce)
    it('GET /api/contracts/:id/report - Reporte con referencias rotas (Simulacro)', async () => {
        const brokenContract = await new Contract({
            ...baseContractData,
            name: "Broken Contract",
            createdBy: adminId,
            resources: [{ resource: resourceId, quantity: 10 }],
            // Ponemos costo 0 para que no sume nada y coincida con la lógica
            providers: [{ provider: providerId, cost: 0 }], 
            personnel: [{ person: personnelId, hours: 5 }]
        }).save();

        // Borramos las dependencias reales para que populate devuelva null
        await Resource.findByIdAndDelete(resourceId);
        await Provider.findByIdAndDelete(providerId);
        await Personnel.findByIdAndDelete(personnelId);

        const res = await request(app).get(`/api/contracts/${brokenContract._id}/report`).set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
        // El cálculo debe ser 0 porque las referencias son null
        expect(res.body.data.grandTotal).toBe(0);

        // Restauramos dependencias
        await new Resource({ _id: resourceId, name: "Restored", quantity: 1, cost: 1, resourceType: new mongoose.Types.ObjectId(), createdBy: adminId }).save();
    });

    // ==================================================
    // 3. ACTUALIZAR (UPDATE)
    // ==================================================

    it('PUT /api/contracts/:id - Actualizar estado a activo', async () => {
        const res = await request(app).put(`/api/contracts/${contractId}`).set('x-access-token', tokenAdmin).send({ status: "activo" });
        expect(res.statusCode).toBe(200);
    });

    it('PUT /api/contracts/:id - Fallo: Fechas invertidas', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Temp Date", createdBy: adminId }).save();
        const res = await request(app).put(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin).send({ 
            startDate: "2025-12-31", endDate: "2025-01-01" 
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/fecha de fin/i);
    });

    it('PUT /api/contracts/:id - Fallo: ID válido pero contrato no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/contracts/${fakeId}`).set('x-access-token', tokenAdmin).send({ name: "Ghost" });
        expect(res.statusCode).toBe(404);
    });

    it('PUT /api/contracts/:id - Fallo: Actualizar con Recurso falso', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Temp Res Upd", createdBy: adminId }).save();
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin).send({
            resources: [{ resource: fakeId, quantity: 1 }]
        });
        expect(res.statusCode).toBe(404);
    });

    it('PUT /api/contracts/:id - Fallo: Actualizar con Proveedor falso', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Temp Prov Upd", createdBy: adminId }).save();
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin).send({
            providers: [{ provider: fakeId, cost: 1 }]
        });
        expect(res.statusCode).toBe(404);
    });

    it('PUT /api/contracts/:id - Fallo: Actualizar con Personal falso', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Temp Pers Upd", createdBy: adminId }).save();
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin).send({
            personnel: [{ person: fakeId, role: "X", hours: 1 }]
        });
        expect(res.statusCode).toBe(404);
    });

    // ==================================================
    // 4. ELIMINAR (DELETE)
    // ==================================================

    it('DELETE /api/contracts/:id - Admin elimina contrato', async () => {
        const res = await request(app).delete(`/api/contracts/${contractId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    it('GET /api/contracts/:id - Confirmar eliminación', async () => {
        const res = await request(app).get(`/api/contracts/${contractId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(404);
    });

    // ==================================================
    // 🔥 ZONA DE SABOTAJE: ERRORES 500 (Líneas 334, 355, etc.)
    // ==================================================

    it('GET /api/contracts - Error 500 al listar', async () => {
        jest.spyOn(Contract, 'countDocuments').mockImplementationOnce(() => { throw new Error('DB Crash Count'); });
        const res = await request(app).get('/api/contracts').set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('GET /api/contracts/:id - Error 500 al buscar por ID', async () => {
        jest.spyOn(Contract, 'findById').mockImplementationOnce(() => { throw new Error('DB Crash Find'); });
        const temp = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/contracts/${temp}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('GET /api/contracts/search - Error 500 al buscar', async () => {
        jest.spyOn(Contract, 'find').mockImplementationOnce(() => { throw new Error('DB Crash Search'); });
        const res = await request(app).get('/api/contracts/search?name=Test').set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('GET /api/contracts/count-by-status - Error 500 Aggregate', async () => {
        jest.spyOn(Contract, 'aggregate').mockImplementationOnce(() => { throw new Error('Crash'); });
        const res = await request(app).get('/api/contracts/count-by-status').set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('POST /api/contracts - Error 500 al crear', async () => {
        jest.spyOn(Contract.prototype, 'save').mockImplementationOnce(() => { throw new Error('DB Crash Save'); });
        const res = await request(app).post('/api/contracts').set('x-access-token', tokenAdmin).send({ ...baseContractData, name: "Fail 500" });
        expect(res.statusCode).toBe(500);
    });

    it('PUT /api/contracts/:id - Error 500 al actualizar', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Temp 500 Upd", createdBy: adminId }).save();
        jest.spyOn(Contract, 'findByIdAndUpdate').mockImplementationOnce(() => { throw new Error('DB Crash Update'); });
        const res = await request(app).put(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin).send({ clientName: "Fail" });
        expect(res.statusCode).toBe(500);
    });

    it('DELETE /api/contracts/:id - Error 500 al eliminar', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Temp 500 Del", createdBy: adminId }).save();
        jest.spyOn(Contract, 'findByIdAndDelete').mockImplementationOnce(() => { throw new Error('DB Crash Delete'); });
        const res = await request(app).delete(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });
    
    it('GET /api/contracts/:id/report - Error 500 al generar reporte', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Temp 500 Rep", createdBy: adminId }).save();
        jest.spyOn(Contract, 'findById').mockImplementationOnce(() => { throw new Error('DB Crash Report'); });
        const res = await request(app).get(`/api/contracts/${temp._id}/report`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    // ==================================================================
    // 🔧 PRUEBAS DE CIERRE (Para el 100%)
    // ==================================================================

    // 1. Cubrir Línea 57 y Helpers en UPDATE: Arrays vacíos
    it('PUT /api/contracts/:id - Éxito: Actualizar limpiando arrays (Helpers return null)', async () => {
        // Creamos un contrato nuevo y fresco para esta prueba
        const tempContract = await new Contract({ 
            ...baseContractData, 
            name: "Contract To Clean", 
            createdBy: adminId 
        }).save();

        const res = await request(app)
            .put(`/api/contracts/${tempContract._id}`)
            .set('x-access-token', tokenAdmin)
            .send({ 
                personnel: [],
                resources: [],
                providers: []
            });
            
        expect(res.statusCode).toBe(200);
        expect(res.body.data.personnel.length).toBe(0);
    });

    // 2. Cubrir Línea 183: Validación de fechas (Camino Feliz)
    it('PUT /api/contracts/:id - Éxito: Actualizar con fechas válidas', async () => {
        // Creamos otro contrato nuevo
        const tempContract = await new Contract({ 
            ...baseContractData, 
            name: "Contract Date Update", 
            createdBy: adminId 
        }).save();

        const res = await request(app)
            .put(`/api/contracts/${tempContract._id}`)
            .set('x-access-token', tokenAdmin)
            .send({ 
                startDate: "2025-02-01", 
                endDate: "2025-02-05" // Fecha válida mayor a inicio
            });
            
        expect(res.statusCode).toBe(200);
    });

    // 3. Cubrir Líneas 232-233: Cálculos de Reporte con "Hours" en 0 o indefinido
    // Esto prueba la parte de `(item.hours || 0)`
    it('GET /api/contracts/:id/report - Reporte con personal con 0 horas', async () => {
        // Creamos un contrato con personal pero con 0 horas
        const zeroHourContract = await new Contract({
            ...baseContractData,
            name: "Zero Hour Contract",
            createdBy: adminId,
            personnel: [{ person: personnelId, hours: 0, role: "Test" }]
        }).save();

        const res = await request(app).get(`/api/contracts/${zeroHourContract._id}/report`).set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
        // El total de personal debe ser 0 (0 horas * 50 tarifa)
        expect(res.body.data.personnel.total).toBe(0);
    });

    // 1. Cubrir Línea 57: Enviar objeto SIN la propiedad personnel (undefined)
    it('POST /api/contracts - Éxito: Crear contrato sin propiedad personnel', async () => {
        // Copiamos el objeto y BORRAMOS la clave personnel
        const data = { ...baseContractData, name: "Undefined Personnel" };
        delete data.personnel; 
        
        const res = await request(app).post('/api/contracts').set('x-access-token', tokenAdmin).send(data);
        expect(res.statusCode).toBe(201);
    });

    // 2. Cubrir Línea 183: Update parcial de fechas (Solo Start o Solo End)
    it('PUT /api/contracts/:id - Éxito: Actualizar solo fecha inicio', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Partial Date", createdBy: adminId }).save();
        const res = await request(app).put(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin).send({ 
            startDate: "2025-02-01" 
            // No enviamos endDate
        });
        expect(res.statusCode).toBe(200);
    });

    // 3. Cubrir Líneas 232-233: Personal sin propiedad 'hours'
    it('GET /api/contracts/:id/report - Reporte con personal sin horas definidas', async () => {
        // Creamos contrato con personal pero SIN la propiedad hours
        const noHourContract = await new Contract({
            ...baseContractData,
            name: "No Hour Prop Contract",
            createdBy: adminId,
            personnel: [{ person: personnelId, role: "Test" }] // Sin hours
        }).save();

        const res = await request(app).get(`/api/contracts/${noHourContract._id}/report`).set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data.personnel.total).toBe(0);
    });

    // 4. Refuerzo Línea 194: ID válido pero no existe (Asegurar que entre al if !updatedContract)
    it('PUT /api/contracts/:id - Fallo: Contrato no existe (404 explícito)', async () => {
        // Generamos un ID válido que seguro no existe
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/contracts/${nonExistentId}`)
            .set('x-access-token', tokenAdmin)
            .send({ name: "Should Fail" });
            
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/no encontrado/i);
    });

    it('PUT /api/contracts/:id - Fallo: ID válido pero inexistente (Línea 194)', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/contracts/${nonExistentId}`)
            .set('x-access-token', tokenAdmin)
            .send({ name: "Ghost Update" });
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/no encontrado/i);
    });

    it('GET /api/contracts/:id/report - Reporte con referencias rotas (Líneas 232-233)', async () => {
        // 1. Crear contrato
        const brokenContract = await new Contract({
            ...baseContractData,
            name: "Broken Refs Report",
            createdBy: adminId,
            // Ponemos quantity 0 y cost 0 para aislar el problema del personal
            resources: [],
            providers: [],
            personnel: [{ person: personnelId, hours: 10 }] // Este es el que vamos a romper
        }).save();

        // 2. BORRAR EL PERSONAL REAL
        await Personnel.findByIdAndDelete(personnelId);

        // 3. Pedir reporte
        const res = await request(app).get(`/api/contracts/${brokenContract._id}/report`).set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
        // Como item.person es null, el ternario debe devolver 0
        expect(res.body.data.personnel.total).toBe(0);

        // 4. Restaurar personal para no romper otros tests
        await new Personnel({ 
            _id: personnelId, 
            firstName: "Restored", 
            lastName: "Person", 
            email: "r@r.com", 
            personnelType: new mongoose.Types.ObjectId() 
        }).save();
    });

it('GET /api/contracts/:id/report - Reporte con referencias rotas (ID falso)', async () => {
        // 1. Generamos un ID que sabemos que NO existe en la DB
        const fakePersonId = new mongoose.Types.ObjectId();

        // 2. Creamos un contrato que apunta a ese "personal fantasma"
        const brokenContract = await new Contract({
            ...baseContractData,
            name: "Report Null Ref",
            createdBy: adminId,
            // Arrays vacíos para aislar la prueba
            resources: [],
            providers: [],
            // Al poblar, 'person' será null porque el ID no existe
            personnel: [{ person: fakePersonId, hours: 10 }] 
        }).save();

        // 3. Pedimos el reporte
        const res = await request(app)
            .get(`/api/contracts/${brokenContract._id}/report`)
            .set('x-access-token', tokenAdmin);
        
        // 4. Validaciones
        expect(res.statusCode).toBe(200); // Ya no debería dar 500
        // La lógica del controlador (item.person ? ... : 0) debe sumar 0
        expect(res.body.data.personnel.total).toBe(0); 
    });

    // ==================================================================
    // 🎯 ÚLTIMOS DISPAROS DE PRECISIÓN (Para el 100% Final)
    // ==================================================================

    // 1. Refuerzo Línea 57: Enviar NULL explícito en personnel
    it('POST /api/contracts - Éxito: Crear con personnel NULL explícito', async () => {
        const data = { ...baseContractData, name: "Null Personnel Explicit", personnel: null };
        const res = await request(app).post('/api/contracts').set('x-access-token', tokenAdmin).send(data);
        expect(res.statusCode).toBe(201);
    });

    // 2. Refuerzo Línea 183: Update Parcial de Fechas (Solo Start)
    it('PUT /api/contracts/:id - Éxito: Actualizar SOLO fecha inicio (Sin End)', async () => {
        // Creamos contrato temporal
        const temp = await new Contract({ ...baseContractData, name: "Partial Date 2", createdBy: adminId }).save();
        
        const res = await request(app).put(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin).send({ 
            startDate: "2025-06-01" 
            // NO enviamos endDate para que la condición compuesta del IF se evalúe diferente
        });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data.startDate).toBe("2025-06-01T00:00:00.000Z");
    });

    // 3. Refuerzo Línea 194: Contrato no encontrado (Asegurar ID válido)
    it('PUT /api/contracts/:id - Fallo: ID válido inexistente (404 Force)', async () => {
        const validObjectId = new mongoose.Types.ObjectId(); // Generamos uno nuevo, seguro no existe
        const res = await request(app)
            .put(`/api/contracts/${validObjectId}`)
            .set('x-access-token', tokenAdmin)
            .send({ name: "Ghost Contract 2" });
            
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/no encontrado/i);
    });

    // 4. Refuerzo Líneas 232-233: Personal existe en contrato pero el ID apunta a nada (Populate devuelve null)
    it('GET /api/contracts/:id/report - Reporte con referencia de personal inexistente', async () => {
        // Generamos un ID que es válido en formato pero no existe en la DB
        const fakePersonId = new mongoose.Types.ObjectId();

        // Creamos un contrato apuntando a ese fantasma
        const brokenContract = await new Contract({
            ...baseContractData,
            name: "Report Null Ref 2",
            createdBy: adminId,
            resources: [],
            providers: [],
            // 'item' existirá, pero 'item.person' será null al poblar
            personnel: [{ person: fakePersonId, hours: 10, role: "Ghost" }] 
        }).save();

        const res = await request(app)
            .get(`/api/contracts/${brokenContract._id}/report`)
            .set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(200);
        // La lógica (item.person ? ... : 0) debe evaluar falso y sumar 0
        expect(res.body.data.personnel.total).toBe(0); 
    });

    // ==================================================================
    // 🚑 REFUERZOS FINALES (Para borrar las últimas líneas rojas)
    // ==================================================================

    // 1. Refuerzo Línea 183: Update con AMBAS fechas (Camino Feliz explícito)
    it('PUT /api/contracts/:id - Éxito: Actualizar ambas fechas correctamente', async () => {
        const temp = await new Contract({ ...baseContractData, name: "Both Dates", createdBy: adminId }).save();
        const res = await request(app).put(`/api/contracts/${temp._id}`).set('x-access-token', tokenAdmin).send({ 
            startDate: "2025-06-01",
            endDate: "2025-06-05"
        });
        expect(res.statusCode).toBe(200);
    });

    // 2. Refuerzo Líneas 334 y 355: Reintentar Sabotaje con MockImplementation diferente
    // A veces findByIdAndDelete necesita ser mockeado en el modelo, no en el prototipo
    it('DELETE /api/contracts/:id - Error 500 Force (Alternative Mock)', async () => {
        // Restauramos mocks previos por si acaso
        jest.restoreAllMocks();
        // Mockeamos directamente la función del modelo
        jest.spyOn(Contract, 'findByIdAndDelete').mockRejectedValue(new Error('Force Fail Delete'));
        
        const res = await request(app).delete(`/api/contracts/${contractId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });

    it('GET /api/contracts/:id/report - Error 500 Force (Alternative Mock)', async () => {
        jest.restoreAllMocks();
        // Mockeamos findById para que falle al intentar buscar para el reporte
        jest.spyOn(Contract, 'findById').mockImplementation(() => {
            throw new Error('Force Fail Report');
        });
        
        const res = await request(app).get(`/api/contracts/${contractId}/report`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(500);
    });
});