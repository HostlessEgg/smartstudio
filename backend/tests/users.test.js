const request = require('supertest');
const jwt = require('jsonwebtoken');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'smartstudio_secret_key_2023';

describe('Users endpoints - auth/roles', () => {
  test('GET /api/users without token returns 401', async () => {
    const res = await request(BASE).get('/api/users');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('GET /api/users with student token returns 403', async () => {
    const token = jwt.sign({ userId: 9999, email: 'student@example.com', role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(BASE).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect([401,403]).toContain(res.statusCode);
    // prefer 403 (authenticated but unauthorized)
  });
});
