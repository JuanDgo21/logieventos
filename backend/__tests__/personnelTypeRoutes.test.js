const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const PersonnelType = require('../models/PersonnelType');
// Importamos Contract para asegurar que Mongoose lo registre antes de borrar
// (ya que el controlador de borrado lo usa)
try { require('../models/Contract'); } catch (e) {} 

// --- VARIABLES GLOBALES ---
let tokenAdmin = '';
let tokenCoordinador = '';
let personnelTypeId = ''; 

// 1. Datos Admin
const adminUser = {
    document: 33333333,
    fullname: "Admin PersonnelType",
    username: "admin_pers_type",
    email: "admin_pers@test.com",
    password: "password123",
    role: "admin"
};

// 2. Datos Coordinador
const coordUser = {
    document: 44444444,
    fullname: "Coord PersonnelType",
    username: "coord_pers_type",
    email: "coord_pers@test.com",
    password: "password123",
    role: "coordinador"
};

// 3. Objeto de Prueba
const personnelTypePrueba = {
    name: "Mesero Senior Jest",
    description: "Personal con experiencia en servicio a la mesa",
    rate: 50000, // Enviamos tarifa porque tu controlador la menciona
    isActive: true
};

describe('Pruebas de Integración: Tipos de Personal', () => {

    // --- SETUP ---
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test';
        await mongoose.connect(testDB);

        // Limpieza
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await PersonnelType.deleteMany({ name: personnelTypePrueba.name });

        // Crear usuarios (Sin hash manual)
        await new User(adminUser).save();
        await new User(coordUser).save();
    });

    // --- TEARDOWN ---
    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminUser.email, coordUser.email] } });
        await PersonnelType.deleteMany({ name: personnelTypePrueba.name });
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
        expect(resCoord.statusCode).toBe(200);
    });

    // --- CREATE (POST) ---
    it('POST /api/personnel-types - Admin crea un Tipo de Personal', async () => {
        const res = await request(app)
            .post('/api/personnel-types')
            .set('x-access-token', tokenAdmin)
            .send(personnelTypePrueba);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(personnelTypePrueba.name);
        
        personnelTypeId = res.body.data._id;
    });

    it('POST /api/personnel-types - Error al duplicar nombre', async () => {
        const res = await request(app)
            .post('/api/personnel-types')
            .set('x-access-token', tokenAdmin)
            .send(personnelTypePrueba);

        expect(res.statusCode).toBe(400); // Requiere haber borrado el middleware en el Modelo
        expect(res.body.message).toMatch(/ya existe/i);
    });

    // --- READ (GET) ---
    it('GET /api/personnel-types - Coordinador lista los tipos', async () => {
        const res = await request(app)
            .get('/api/personnel-types')
            .set('x-access-token', tokenCoordinador);

        expect(res.statusCode).toBe(200);
        const existe = res.body.data.some(p => p._id === personnelTypeId);
        expect(existe).toBe(true);
    });

    // --- UPDATE (PUT) ---
    it('PUT /api/personnel-types/:id - Coordinador actualiza descripción', async () => {
        const nuevaDesc = "Descripción actualizada por Coordinador";
        const res = await request(app)
            .put(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ description: nuevaDesc });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.description).toBe(nuevaDesc);
    });

    it('PUT /api/personnel-types/:id - Coordinador NO puede cambiar isActive', async () => {
        const res = await request(app)
            .put(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenCoordinador)
            .send({ isActive: false });

        expect(res.statusCode).toBe(403);
    });

    // --- DELETE (DELETE) ---
    it('DELETE /api/personnel-types/:id - Admin elimina el registro', async () => {
        const res = await request(app)
            .delete(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenAdmin);

        expect(res.statusCode).toBe(200);
    });
    
    it('GET /api/personnel-types/:id - Confirmar eliminación', async () => {
        const res = await request(app)
            .get(`/api/personnel-types/${personnelTypeId}`)
            .set('x-access-token', tokenAdmin);
            
        expect(res.statusCode).toBe(404);
    });

});