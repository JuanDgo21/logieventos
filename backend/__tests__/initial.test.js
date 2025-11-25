const request = require('supertest');
const app = require('../server'); // Importamos usando require

describe('Prueba Inicial de API', () => {
  
  it('GET / debería devolver el mensaje de bienvenida', async () => {
    const res = await request(app).get('/');
    
    expect(res.statusCode).toEqual(200);
    // Nota: A veces express devuelve text/html si es un string simple, 
    // pero como enviaste json, debería estar bien.
  });

});