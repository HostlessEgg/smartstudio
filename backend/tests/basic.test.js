const request = require('supertest');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Basic endpoints', () => {
  test('health returns OK', async () => {
    const res = await request(BASE).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('config returns threshold', async () => {
    const res = await request(BASE).get('/api/config');
    expect(res.statusCode).toBe(200);
    expect(res.body.quizPassThreshold).toBeDefined();
  });
});
