const request = require('supertest');
const mysql = require('mysql2/promise');
require('dotenv').config();

let token;
let createdId;
let app;

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

beforeAll(async () => {
  // create a test user (teacher) and get token
  const email = `test-teacher+${Date.now()}@example.com`;
  const resReg = await request(BASE).post('/api/auth/register').send({
    name: 'Test Teacher',
    email,
    password: 'Aa123456!',
    role: 'teacher'
  });
  expect(resReg.statusCode === 201 || resReg.statusCode === 200).toBeTruthy();

  const resLogin = await request(BASE).post('/api/auth/login').send({ email, password: 'Aa123456!' });
  expect(resLogin.statusCode).toBe(200);
  token = resLogin.body.token;
});

afterAll(async () => {
  // cleanup created assignment if exists
  if (createdId) {
    await request(BASE).delete(`/api/assignments/${createdId}`).set('Authorization', `Bearer ${token}`);
  }
});

test('Create, read, update, delete assignment flow', async () => {
  // create
  const startAt = new Date().toISOString().slice(0,19).replace('T',' ');
  const createRes = await request(BASE)
    .post('/api/assignments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Prueba Automatizada',
      description: 'Descripción prueba',
      start_at: startAt,
      end_at: null
    });
  expect([200,201]).toContain(createRes.statusCode);
  createdId = createRes.body.id || createRes.body.assignmentId || createRes.body.insertId || createRes.body.assignment?.id;
  expect(createdId).toBeTruthy();

  // list
  const listRes = await request(BASE).get('/api/assignments').set('Authorization', `Bearer ${token}`);
  expect(listRes.statusCode).toBe(200);
  const found = (listRes.body || []).find(a => Number(a.id) === Number(createdId));
  expect(found).toBeTruthy();

  // update
  const updateRes = await request(BASE)
    .put(`/api/assignments/${createdId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Prueba Actualizada', start_at: startAt });
  expect([200,204]).toContain(updateRes.statusCode);

  // get single
  const getRes = await request(BASE).get('/api/assignments').set('Authorization', `Bearer ${token}`);
  expect(getRes.statusCode).toBe(200);

  // delete
  const delRes = await request(BASE)
    .delete(`/api/assignments/${createdId}`)
    .set('Authorization', `Bearer ${token}`);
  expect([200,204]).toContain(delRes.statusCode);

  // ensure removed
  const listAfter = await request(BASE).get('/api/assignments').set('Authorization', `Bearer ${token}`);
  const still = (listAfter.body || []).find(a => Number(a.id) === Number(createdId));
  expect(still).toBeFalsy();
});
