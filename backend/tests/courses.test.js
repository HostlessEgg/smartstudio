const request = require('supertest');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Courses endpoints - pagination', () => {
  test('GET /api/courses returns meta and data', async () => {
    const res = await request(BASE).get('/api/courses');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('meta');
    expect(res.body).toHaveProperty('data');
    expect(typeof res.body.meta.total).toBe('number');
    expect(typeof res.body.meta.total_pages).toBe('number');
    expect(typeof res.body.meta.page).toBe('number');
    expect(typeof res.body.meta.per_page).toBe('number');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/courses with pagination params echoes page and per_page', async () => {
    const res = await request(BASE).get('/api/courses?page=2&per_page=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.per_page).toBe(5);
  });
});
const request = require('supertest');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Courses endpoints - pagination', () => {
  test('GET /api/courses returns meta and data', async () => {
    const res = await request(BASE).get('/api/courses');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('meta');
    expect(res.body).toHaveProperty('data');
    expect(typeof res.body.meta.total).toBe('number');
    expect(typeof res.body.meta.page).toBe('number');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/courses respects page and per_page', async () => {
    const res = await request(BASE).get('/api/courses?page=1&per_page=2');
    expect(res.statusCode).toBe(200);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.per_page).toBe(2);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });
});
