const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Contract = require('../models/Contract');
const Report = require('../models/Report');

let tokenAdmin = '';

const adminUser = {
    document: 88889999,
    fullname: "Admin Special",
    username: "admin_special",
    email: "special@test.com",
    password: "password123",
    role: "admin"
};

describe('Pruebas Ruta Especial: Reportes desde Contratos', () => {

    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test_reports_special';
        await mongoose.connect(testDB);
        await User.deleteMany({});
        await Report.deleteMany({});
        await new User(adminUser).save();
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Report.deleteMany({});
        await mongoose.connection.close();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Login', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: adminUser.email, password: adminUser.password
        });
        tokenAdmin = res.body.token;
        expect(res.statusCode).toBe(200);
    });

    // --- RUTA /from-contracts ---
    it('POST /api/reports/from-contracts - Éxito al generar reporte', async () => {
        // Simulamos la cadena compleja: Contract.find().populate().populate().populate().lean()
        const mockChain = {
            populate: jest.fn().mockReturnThis(), 
            lean: jest.fn().mockResolvedValue([
                { _id: 'c1', name: 'Contrato A', event: { name: 'Evento A' } }
            ])
        };

        const mockFind = jest.spyOn(Contract, 'find').mockReturnValue(mockChain);

        const res = await request(app)
            .post('/api/reports/from-contracts')
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.data[0].name).toBe('Contrato A');
        
        mockFind.mockRestore();
    });

    it('POST /api/reports/from-contracts - Error 500 (DB Fails)', async () => {
        const mockChain = {
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockRejectedValue(new Error("Error generando reporte auto"))
        };

        const mockFind = jest.spyOn(Contract, 'find').mockReturnValue(mockChain);

        const res = await request(app)
            .post('/api/reports/from-contracts')
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toMatch(/error al generar reporte/i);
        
        mockFind.mockRestore();
    });
});