const request = require('supertest');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Auth validation', () => {
  test('csrf endpoint returns token', async () => {
    const res = await request(BASE).get('/api/auth/csrf');
    expect(res.statusCode).toBe(200);
    expect(res.body.csrfToken).toBeDefined();
  });

  test('register rejects weak password', async () => {
    const res = await request(BASE)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'weak', role: 'student' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('login rejects invalid email format', async () => {
    const res = await request(BASE)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'whatever' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('me without token returns 401', async () => {
    const res = await request(BASE).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
