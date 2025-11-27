const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Personnel = require('../models/Personnel');
const PersonnelType = require('../models/PersonnelType');

// --- DATOS MÍNIMOS REQUERIDOS PARA EL CONTRATO ---
const contractRequiredData = {
    name: 'Contrato Test Dummy',
    clientName: 'Cliente Test',
    clientEmail: 'client@test.com',
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)), // +7 dias
};

// Intentamos cargar el modelo Contract, si no existe, lo definimos "al vuelo"
let Contract;
try {
    Contract = require('../models/Contract');
} catch (e) {
    const contractSchema = new mongoose.Schema({
        name: { type: String, required: true },
        clientName: { type: String, required: true },
        clientEmail: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        personnel: [{ person: { type: mongoose.Schema.Types.ObjectId, ref: 'Personnel' } }]
    });
    Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
}

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let tokenLider = '';
let personnelTypeId = '';
let personnelId = '';     
let personnelIdInactive = ''; 
const INACTIVE_EMAIL = "inactive@test.com";

// Datos de Usuarios
const adminUser = {
    document: 77777777, fullname: "Admin P", username: "admin_p", email: "admin_p@test.com", password: "password123", role: "admin"
};
const coordUser = {
    document: 88888888, fullname: "Coord P", username: "coord_p", email: "coord_p@test.com", password: "password123", role: "coordinador"
};
const liderUser = {
    document: 99999999, fullname: "Lider P", username: "lider_p", email: "lider_p@test.com", password: "password123", role: "lider"
};

const personnelPrueba = {
    firstName: "Juan", lastName: "Pérez", email: "juan.perez@test.com", phone: "3001234567", skills: ["JS"]
};

describe('Pruebas de Integración: Gestión de Personal (Cobertura 100%)', () => {

    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test_coverage';
        await mongoose.connect(testDB);

        // Limpieza total
        await User.deleteMany({});
        await Personnel.deleteMany({});
        await PersonnelType.deleteMany({});
        await Contract.deleteMany({});
        
        // CRÍTICO: Asegurar índices para que el error 11000 salte correctamente
        await Personnel.createIndexes(); 

        await new User(adminUser).save();
        await new User(coordUser).save();
        await new User(liderUser).save();

        const tipo = await new PersonnelType({
            name: "Tipo Test", description: "Desc", rate: 20000, createdBy: new mongoose.Types.ObjectId()
        }).save();
        personnelTypeId = tipo._id;
    });

    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email, liderUser.email] } });
        await Personnel.deleteMany({});
        await PersonnelType.deleteMany({});
        await Contract.deleteMany({});
        await mongoose.connection.close();
    });

    // --- 1. AUTENTICACIÓN ---
    it('Debería loguearse y obtener tokens para todos los roles', async () => {
        const resAdmin = await request(app).post('/api/auth/signin').send({ email: adminUser.email, password: adminUser.password });
        tokenAdmin = resAdmin.body.token;

        const resCoord = await request(app).post('/api/auth/signin').send({ email: coordUser.email, password: coordUser.password });
        tokenCoordinador = resCoord.body.token;

        const resLider = await request(app).post('/api/auth/signin').send({ email: liderUser.email, password: liderUser.password });
        tokenLider = resLider.body.token;

        expect(resAdmin.statusCode).toBe(200);
    });

    // --- 2. CREATE (POST) ---
    describe('POST /api/personnel', () => {
        it('Debería fallar (403) si un Líder intenta crear personal', async () => {
            const res = await request(app).post('/api/personnel')
                .set('x-access-token', tokenLider)
                .send({ ...personnelPrueba, email: "liderfail@test.com", personnelType: personnelTypeId });
            expect(res.statusCode).toBe(403);
        });

        it('Debería fallar (400) si faltan campos obligatorios', async () => {
            const res = await request(app).post('/api/personnel')
                .set('x-access-token', tokenAdmin)
                .send({ firstName: "SoloNombre" });
            expect(res.statusCode).toBe(400);
        });

        it('Debería fallar (404) si el Tipo de Personal no existe (Cobertura línea 94)', async () => {
            // Generamos un ID válido pero que NO existe en la colección de tipos
            const nonExistentId = new mongoose.Types.ObjectId();
            
            const res = await request(app).post('/api/personnel')
                .set('x-access-token', tokenAdmin)
                .send({ ...personnelPrueba, email: "typefail@test.com", personnelType: nonExistentId });
            
            expect(res.statusCode).toBe(404);
            expect(res.body.message).toMatch(/no existe/i);
        });

        it('Debería crear personal DISPONIBLE exitosamente (Admin)', async () => {
            const res = await request(app).post('/api/personnel')
                .set('x-access-token', tokenAdmin)
                .send({ ...personnelPrueba, personnelType: personnelTypeId });
            expect(res.statusCode).toBe(201);
            personnelId = res.body.data._id;
        });

        it('Debería crear personal INACTIVO (no disponible) para pruebas de Líder', async () => {
            const inactivePerson = await new Personnel({
                firstName: "Inactive", lastName: "Man", email: INACTIVE_EMAIL,
                personnelType: personnelTypeId, status: "inactivo"
            }).save();
            personnelIdInactive = inactivePerson._id;
            expect(inactivePerson.status).toBe('inactivo');
        });

        it('Debería fallar (400) por email duplicado (Cobertura líneas 142-146)', async () => {
            // Intentamos crear exactamente el mismo usuario que ya existe
            const res = await request(app).post('/api/personnel')
                .set('x-access-token', tokenAdmin)
                .send({ ...personnelPrueba, personnelType: personnelTypeId });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/ya existe/i);
        });
    });

    // --- 3. READ (GET) ---
    describe('GET /api/personnel', () => {
        it('Admin ve todo el personal', async () => {
            const res = await request(app).get('/api/personnel').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it('Líder solo ve personal "disponible"', async () => {
            const res = await request(app).get('/api/personnel').set('x-access-token', tokenLider);
            expect(res.statusCode).toBe(200);
            const inactivos = res.body.data.filter(p => p.status !== 'disponible');
            expect(inactivos.length).toBe(0);
        });
    });

    describe('GET /api/personnel/:id', () => {
        it('Debería fallar (404) si el ID no existe', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/personnel/${fakeId}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        it('Admin puede ver personal inactivo', async () => {
            const res = await request(app).get(`/api/personnel/${personnelIdInactive}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        it('Líder NO puede ver personal inactivo (403)', async () => {
            const res = await request(app).get(`/api/personnel/${personnelIdInactive}`).set('x-access-token', tokenLider);
            expect(res.statusCode).toBe(403);
        });
    });

    // --- 4. UPDATE (PUT) ---
    describe('PUT /api/personnel/:id', () => {
        it('Debería fallar (403) si Líder intenta actualizar', async () => {
            const res = await request(app).put(`/api/personnel/${personnelId}`)
                .set('x-access-token', tokenLider).send({ firstName: "Hack" });
            expect(res.statusCode).toBe(403);
        });

        it('Debería fallar (403) si Coordinador intenta cambiar estado', async () => {
            const res = await request(app).put(`/api/personnel/${personnelId}`)
                .set('x-access-token', tokenCoordinador).send({ status: "inactivo" });
            expect(res.statusCode).toBe(403);
        });

        it('Debería fallar (404) si se envía un personnelType inválido', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app).put(`/api/personnel/${personnelId}`)
                .set('x-access-token', tokenAdmin)
                .send({ personnelType: nonExistentId });
            expect(res.statusCode).toBe(404);
        });

        it('Debería fallar (404) al actualizar un ID inexistente', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).put(`/api/personnel/${fakeId}`)
                .set('x-access-token', tokenAdmin).send({ firstName: "Ghost" });
            expect(res.statusCode).toBe(404);
        });

        it('Debería actualizar correctamente incluyendo personnelType', async () => {
            const res = await request(app).put(`/api/personnel/${personnelId}`)
                .set('x-access-token', tokenAdmin)
                .send({ firstName: "Juan Actualizado", personnelType: personnelTypeId });
            expect(res.statusCode).toBe(200);
            expect(res.body.data.firstName).toBe("Juan Actualizado");
        });

        it('Debería fallar (400) al actualizar email a uno ya existente', async () => {
            // Intentamos ponerle el email INACTIVE_EMAIL al usuario principal
            const res = await request(app).put(`/api/personnel/${personnelId}`)
                .set('x-access-token', tokenAdmin)
                .send({ email: INACTIVE_EMAIL });
            expect(res.statusCode).toBe(400);
            // Esto cubre también el chequeo de duplicados en el bloque UPDATE
        });
    });

    // --- 5. DELETE (DELETE) ---
    describe('DELETE /api/personnel/:id', () => {
        beforeAll(async () => {
            // Cambiamos el email del inactivo para evitar conflictos en otros tests si hubiera reordenamiento
            await Personnel.findByIdAndUpdate(personnelIdInactive, { email: "fixed_inactive@test.com" });
        });

        it('Debería fallar (403) si Coordinador intenta eliminar', async () => {
            const res = await request(app).delete(`/api/personnel/${personnelId}`)
                .set('x-access-token', tokenCoordinador);
            expect(res.statusCode).toBe(403);
        });

        it('Debería fallar (400) si el personal tiene contrato activo', async () => {
            await Contract.create({ 
                ...contractRequiredData,
                personnel: [{ person: personnelId }] 
            });
            
            const res = await request(app).delete(`/api/personnel/${personnelId}`)
                .set('x-access-token', tokenAdmin);
            
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/asignado a uno o más contratos/i);
            
            await Contract.deleteMany({});
        });

        it('Debería fallar (404) al eliminar ID inexistente', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).delete(`/api/personnel/${fakeId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(404);
        });

        it('Debería eliminar correctamente (Admin)', async () => {
            const res = await request(app).delete(`/api/personnel/${personnelId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });
    });

    // --- 6. ERRORES DE SERVIDOR (MOCKING 500) ---
    describe('Manejo de Errores de Servidor (500)', () => {
        it('GET getAllPersonnel - Error 500', async () => {
            const spy = jest.spyOn(Personnel, 'find').mockImplementation(() => { throw new Error('DB Error'); });
            const res = await request(app).get('/api/personnel').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            spy.mockRestore();
        });

        it('GET getPersonnelById - Error 500', async () => {
            const spy = jest.spyOn(Personnel, 'findById').mockImplementation(() => { throw new Error('DB Error'); });
            const res = await request(app).get(`/api/personnel/${personnelIdInactive}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            spy.mockRestore();
        });

        it('POST createPersonnel - Error 500 (Genérico)', async () => {
            // Simulamos error GENÉRICO (no duplicado)
            const spy = jest.spyOn(Personnel.prototype, 'save').mockImplementation(() => { throw new Error('DB Save Error'); });
            const res = await request(app).post('/api/personnel')
                .set('x-access-token', tokenAdmin)
                .send({ ...personnelPrueba, email: "new500@email.com", personnelType: personnelTypeId });
            expect(res.statusCode).toBe(500);
            spy.mockRestore();
        });

        it('PUT updatePersonnel - Error 500', async () => {
            const spy = jest.spyOn(Personnel, 'findByIdAndUpdate').mockImplementation(() => { throw new Error('DB Update Error'); });
            const res = await request(app).put(`/api/personnel/${personnelIdInactive}`)
                .set('x-access-token', tokenAdmin).send({ firstName: "Fail" });
            expect(res.statusCode).toBe(500);
            spy.mockRestore();
        });

        it('DELETE deletePersonnel - Error 500', async () => {
            const contractSpy = jest.spyOn(Contract, 'findOne').mockResolvedValue(null);
            const personnelSpy = jest.spyOn(Personnel, 'findByIdAndDelete').mockImplementation(() => { throw new Error('DB Delete Error'); });

            const res = await request(app).delete(`/api/personnel/${personnelIdInactive}`)
                .set('x-access-token', tokenAdmin);
            
            expect(res.statusCode).toBe(500);
            
            contractSpy.mockRestore();
            personnelSpy.mockRestore();
        });
    });
});