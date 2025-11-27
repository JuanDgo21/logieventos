jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(() => Promise.resolve()),
  };
});

process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');

describe('Pruebas del servidor (server.js)', () => {

  afterAll(async () => {
    // No hay conexión real, así que NO cerramos nada
  });

  test('GET / debe responder correctamente', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('GET /_force_error_test debe devolver 500', async () => {
    const res = await request(app).get('/_force_error_test');
    expect(res.status).toBe(500);
    expect(typeof res.text).toBe('string');
  });

  test('mongoose.connect NO debe llamarse en ambiente de test', () => {
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

});
