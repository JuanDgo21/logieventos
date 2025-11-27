const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const PersonnelType = require('../models/PersonnelType');

// Variable global para el modelo Contract
let Contract;
try {
    Contract = require('../models/Contract');
} catch (e) {
    Contract = mongoose.model('Contract', new mongoose.Schema({}));
}

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let tokenLider = ''; 
let personnelTypeId = ''; 
let personnelTypeIdInactive = ''; 

// Datos Admin
const adminUser = {
    document: 33333333, fullname: "Admin PT", username: "admin_pt", email: "admin_pt@test.com", password: "password123", role: "admin"
};
// Datos Coordinador
const coordUser = {
    document: 44444444, fullname: "Coord PT", username: "coord_pt", email: "coord_pt@test.com", password: "password123", role: "coordinador"
};
// Datos Líder
const liderUser = {
    document: 55555555, fullname: "Lider PT", username: "lider_pt", email: "lider_pt@test.com", password: "password123", role: "lider"
};

const personnelTypePrueba = {
    name: "Mesero Test 100", description: "Desc", rate: 50000, isActive: true
};

const contractRequiredData = {
    name: 'Contrato Test PT',
    clientName: 'Cliente PT',
    clientEmail: 'clientpt@test.com',
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 86400000)
};

describe('Pruebas de Integración: Tipos de Personal (100% Cobertura)', () => {

    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test_pt_coverage';
        await mongoose.disconnect();
        await mongoose.connect(testDB);

        await User.deleteMany({});
        await PersonnelType.deleteMany({});
        await PersonnelType.createIndexes();

        await new User(adminUser).save();
        await new User(coordUser).save();
        await new User(liderUser).save();
    });

    afterAll(async () => {
        await User.deleteMany({});
        await PersonnelType.deleteMany({});
        await mongoose.connection.close();
    });

    // --- 1. LOGIN ---
    it('Debería loguearse y obtener tokens para todos los roles', async () => {
        const resA = await request(app).post('/api/auth/signin').send({ email: adminUser.email, password: adminUser.password });
        tokenAdmin = resA.body.token;

        const resC = await request(app).post('/api/auth/signin').send({ email: coordUser.email, password: coordUser.password });
        tokenCoordinador = resC.body.token;

        const resL = await request(app).post('/api/auth/signin').send({ email: liderUser.email, password: liderUser.password });
        tokenLider = resL.body.token;
        
        expect(resA.statusCode).toBe(200);
    });

    // --- 2. CREATE (POST) ---
    it('POST - Admin crea un Tipo de Personal exitosamente', async () => {
        const res = await request(app).post('/api/personnel-types')
            .set('x-access-token', tokenAdmin).send(personnelTypePrueba);

        expect(res.statusCode).toBe(201);
        personnelTypeId = res.body.data._id;
    });

    it('POST - Error al duplicar nombre (Validación 11000)', async () => {
        const res = await request(app).post('/api/personnel-types')
            .set('x-access-token', tokenAdmin).send(personnelTypePrueba);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/ya existe/i);
    });

    it('POST - Error si faltan campos', async () => {
        const res = await request(app).post('/api/personnel-types')
            .set('x-access-token', tokenAdmin).send({ description: "Falta nombre y rate" });
        expect(res.statusCode).toBe(400);
    });

    it('POST - Crear tipo INACTIVO para pruebas de Líder', async () => {
        const res = await request(app).post('/api/personnel-types')
            .set('x-access-token', tokenAdmin)
            .send({ name: "Inactivo Type", rate: 100 });
        
        personnelTypeIdInactive = res.body.data._id;
        await PersonnelType.findByIdAndUpdate(personnelTypeIdInactive, { isActive: false });
        expect(res.statusCode).toBe(201);
    });

    // --- 3. READ (GET) ---
    it('GET All - Admin ve todos (incluido inactivos)', async () => {
        const res = await request(app).get('/api/personnel-types').set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('GET All - Líder solo ve activos', async () => {
        const res = await request(app).get('/api/personnel-types').set('x-access-token', tokenLider);
        const inactivos = res.body.data.filter(pt => pt.isActive === false);
        expect(inactivos.length).toBe(0); 
    });

    it('GET By ID - Líder NO puede ver tipo inactivo (403)', async () => {
        const res = await request(app).get(`/api/personnel-types/${personnelTypeIdInactive}`)
            .set('x-access-token', tokenLider);
        expect(res.statusCode).toBe(403);
    });

    // --- NUEVO TEST PARA COBERTURA LÍNEA 55 ---
    it('GET By ID - Líder puede ver tipo ACTIVO exitosamente', async () => {
        const res = await request(app).get(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenLider);
        expect(res.statusCode).toBe(200);
    });

    // --- NUEVO TEST PARA COBERTURA LÍNEA 55 ---
    it('GET By ID - Admin puede ver tipo INACTIVO exitosamente', async () => {
        const res = await request(app).get(`/api/personnel-types/${personnelTypeIdInactive}`)
            .set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    it('GET By ID - 404 si no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/personnel-types/${fakeId}`).set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(404);
    });

    // --- 4. UPDATE (PUT) ---
    it('PUT - Coordinador actualiza descripción', async () => {
        const res = await request(app).put(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenCoordinador).send({ description: "Updated Desc" });
        expect(res.statusCode).toBe(200);
    });

    it('PUT - Coordinador NO puede cambiar isActive (403)', async () => {
        const res = await request(app).put(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenCoordinador).send({ isActive: false });
        expect(res.statusCode).toBe(403);
    });

    it('PUT - Error duplicado de nombre (400)', async () => {
        const res = await request(app).put(`/api/personnel-types/${personnelTypeIdInactive}`)
            .set('x-access-token', tokenAdmin).send({ name: personnelTypePrueba.name });
        expect(res.statusCode).toBe(400);
    });

    it('PUT - 404 si ID no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/personnel-types/${fakeId}`)
            .set('x-access-token', tokenAdmin).send({ name: "Ghost" });
        expect(res.statusCode).toBe(404);
    });

    // --- 5. DELETE (DELETE) ---
    it('DELETE - Bloqueado si está en contrato (400)', async () => {
        // Mock simple y efectivo
        const contractSpy = jest.spyOn(Contract, 'findOne').mockResolvedValue({ _id: 'fake' });

        const res = await request(app).delete(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenAdmin);
        
        expect(res.statusCode).toBe(400); 
        expect(res.body.message).toMatch(/asignado a uno o más contratos/i);
        
        contractSpy.mockRestore();
    });

    it('DELETE - Admin elimina exitosamente', async () => {
        const res = await request(app).delete(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(200);
    });

    it('DELETE - 404 si ya fue eliminado', async () => {
        const res = await request(app).delete(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenAdmin);
        expect(res.statusCode).toBe(404);
    });

    // --- 6. ERRORES DE SERVIDOR (500) ---
    describe('Errores 500 simulados', () => {
        it('GET All - 500', async () => {
            const spy = jest.spyOn(PersonnelType, 'find').mockImplementation(() => { throw new Error('DB'); });
            const res = await request(app).get('/api/personnel-types').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            spy.mockRestore();
        });

        it('GET By ID - 500', async () => {
            const spy = jest.spyOn(PersonnelType, 'findById').mockImplementation(() => { throw new Error('DB'); });
            const res = await request(app).get(`/api/personnel-types/${personnelTypeIdInactive}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            spy.mockRestore();
        });

        it('POST - 500', async () => {
            const spy = jest.spyOn(PersonnelType.prototype, 'save').mockImplementation(() => { throw new Error('DB'); });
            const res = await request(app).post('/api/personnel-types').set('x-access-token', tokenAdmin).send(personnelTypePrueba);
            expect(res.statusCode).toBe(500);
            spy.mockRestore();
        });

        it('PUT - 500', async () => {
            const spy = jest.spyOn(PersonnelType, 'findByIdAndUpdate').mockImplementation(() => { throw new Error('DB'); });
            const res = await request(app).put(`/api/personnel-types/${personnelTypeIdInactive}`).set('x-access-token', tokenAdmin).send({name:"X"});
            expect(res.statusCode).toBe(500);
            spy.mockRestore();
        });

        it('DELETE - 500', async () => {
            const contractSpy = jest.spyOn(Contract, 'findOne').mockResolvedValue(null);
            const ptSpy = jest.spyOn(PersonnelType, 'findByIdAndDelete').mockImplementation(() => { throw new Error('DB'); });
            
            const res = await request(app).delete(`/api/personnel-types/${personnelTypeIdInactive}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            
            contractSpy.mockRestore();
            ptSpy.mockRestore();
        });
    });

});