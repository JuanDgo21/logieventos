const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Report = require('../models/Report');
const Contract = require('../models/Contract');

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let reportId = '';

// 1. Datos Admin
const adminUser = {
    document: 99887766,
    fullname: "Admin Report",
    username: "admin_rep",
    email: "admin_rep@test.com",
    password: "password123",
    role: "admin"
};

// 2. Reporte de Prueba
const reportPrueba = {
    title: "Reporte Mensual",
    description: "Resumen de actividades",
    type: "custom", 
    data: { metrics: [10, 20, 30] }
};

describe('Pruebas Maestras: Reportes (Rutas + Controlador)', () => {

    // --- SETUP ---
    beforeAll(async () => {
        // Usamos una DB de prueba dedicada
        const testDB = 'mongodb://localhost:27017/logieventos_test_reports_master_fixed';
        await mongoose.connect(testDB);

        await User.deleteMany({});
        await Report.deleteMany({});
        await Contract.deleteMany({});
        
        await new User(adminUser).save();
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        await User.deleteMany({});
        await Report.deleteMany({});
        await Contract.deleteMany({});
        await mongoose.connection.close();
        jest.restoreAllMocks(); 
    });

    afterEach(() => {
        jest.restoreAllMocks(); 
    });

    // --- LOGIN ---
    it('Debería loguearse y obtener token', async () => {
        const res = await request(app).post('/api/auth/signin').send({
            email: adminUser.email, password: adminUser.password
        });
        tokenAdmin = res.body.token;
        expect(res.statusCode).toBe(200);
    });

    // =================================================================
    // PARTE 1: PRUEBAS DEL CONTROLADOR (CRUD Básico)
    // =================================================================
    describe('1. Controlador: CRUD de Reportes', () => {
        
        it('POST /api/reports - Crea reporte manual exitosamente', async () => {
            const res = await request(app)
                .post('/api/reports')
                .set('x-access-token', tokenAdmin)
                .send(reportPrueba);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.title).toBe(reportPrueba.title);
            reportId = res.body.data._id;
        });

        it('POST /api/reports - Crea reporte tipo "contract" (Lógica interna del controlador)', async () => {
            // Mockeamos Contract.find para que el controlador no falle al buscar
            const mockFind = jest.spyOn(Contract, 'find').mockResolvedValue([{ name: "Contrato Mock" }]);

            const res = await request(app)
                .post('/api/reports')
                .set('x-access-token', tokenAdmin)
                .send({
                    title: "Reporte de Contratos",
                    description: "Auto generado",
                    type: "contract"
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.data.type).toBe('contract');
            
            mockFind.mockRestore();
        });

        it('GET /api/reports - Lista todos los reportes', async () => {
            const res = await request(app)
                .get('/api/reports')
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('GET /api/reports/:id - Obtiene reporte por ID', async () => {
            const res = await request(app)
                .get(`/api/reports/${reportId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        it('PUT /api/reports/:id - Actualiza reporte', async () => {
            const res = await request(app)
                .put(`/api/reports/${reportId}`)
                .set('x-access-token', tokenAdmin)
                .send({ title: "Editado" });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.data.title).toBe("Editado");
        });

        it('DELETE /api/reports/:id - Elimina reporte', async () => {
            const res = await request(app)
                .delete(`/api/reports/${reportId}`)
                .set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(200);
        });

        // --- Mocks de Errores 500 para el Controlador ---
        
        it('Error 500 en GET /api/reports (Find Fail)', async () => {
            // Simulamos error en find().populate()
            const mockFind = jest.spyOn(Report, 'find').mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error("DB Error List"))
            });
            const res = await request(app).get('/api/reports').set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            mockFind.mockRestore();
        });

        it('Error 500 en POST /api/reports (Save Fail)', async () => {
            const mockSave = jest.spyOn(Report.prototype, 'save').mockRejectedValue(new Error("DB Error Save"));
            const res = await request(app).post('/api/reports').set('x-access-token', tokenAdmin).send(reportPrueba);
            expect(res.statusCode).toBe(500);
            mockSave.mockRestore();
        });

        it('Error 500 en PUT /api/reports (Update Fail)', async () => {
            const mockUpdate = jest.spyOn(Report, 'findByIdAndUpdate').mockRejectedValue(new Error("DB Error Update"));
            const res = await request(app).put(`/api/reports/${reportId}`).set('x-access-token', tokenAdmin).send({title: "X"});
            expect(res.statusCode).toBe(500);
            mockUpdate.mockRestore();
        });

        it('Error 500 en DELETE /api/reports (Delete Fail)', async () => {
            const mockDel = jest.spyOn(Report, 'findByIdAndDelete').mockRejectedValue(new Error("DB Error Delete"));
            const dummyId = new mongoose.Types.ObjectId();
            const res = await request(app).delete(`/api/reports/${dummyId}`).set('x-access-token', tokenAdmin);
            expect(res.statusCode).toBe(500);
            mockDel.mockRestore();
        });
    });

    // =================================================================
    // PARTE 2: PRUEBAS DE LA RUTA ESPECIAL (report.routes.js líneas 48-79)
    // =================================================================
    describe('2. Rutas: Generación Automática (/from-contracts)', () => {
        
        // ESTA PRUEBA CUBRE EL CASO DE ÉXITO (Líneas del try)
        it('POST /api/reports/from-contracts - Éxito al generar reporte', async () => {
            // Simulamos la cadena compleja que tienes en la ruta:
            // Contract.find().populate().populate().populate().lean()
            
            // Creamos un objeto "cadena" que siempre se devuelve a sí mismo en los populate
            const mockChain = {
                populate: jest.fn().mockReturnThis(), // Permite encadenar .populate().populate()...
                lean: jest.fn().mockResolvedValue([   // Al final .lean() devuelve los datos
                    { _id: 'c1', name: 'Contrato A', event: { name: 'Evento A' } }
                ])
            };

            // Interceptamos Contract.find() para que devuelva nuestra cadena falsa
            const mockFind = jest.spyOn(Contract, 'find').mockReturnValue(mockChain);

            const res = await request(app)
                .post('/api/reports/from-contracts')
                .set('x-access-token', tokenAdmin);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.type).toBe('contract');
            // Verificamos que usó nuestros datos mockeados
            expect(res.body.data.data[0].name).toBe('Contrato A');

            mockFind.mockRestore();
        });

        // ESTA PRUEBA CUBRE EL CASO DE ERROR (Líneas del catch)
        it('POST /api/reports/from-contracts - Error 500 (Catch Block)', async () => {
            // Simulamos que la cadena falla en el último paso
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

});