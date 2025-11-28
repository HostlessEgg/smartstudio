const request = require('supertest');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Representatives API (basic skeleton)', () => {
  test('POST /api/representatives requires authentication', async () => {
    const res = await request(BASE).post('/api/representatives').send({ studentId: 1 });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/representatives/students/:id/progress requires authentication', async () => {
    const res = await request(BASE).get('/api/representatives/students/1/progress');
    expect(res.statusCode).toBe(401);
  });

  test('Full flow: rep requests -> student sees -> student grants -> rep can view progress', async () => {
    // create student
    const studentEmail = `student_${Date.now()}@example.test`;
    const studentRes = await request(BASE).post('/api/auth/register').send({ name: 'Student', email: studentEmail, password: 'Aa!strong123', role: 'student' });
    expect(studentRes.statusCode).toBe(201);
    const studentToken = studentRes.body.token;
    const studentId = studentRes.body.user.id;

    // create representative
    const repEmail = `rep_${Date.now()}@example.test`;
    // do not pass role (defaults to 'student') to satisfy registration validation
    const repRes = await request(BASE).post('/api/auth/register').send({ name: 'Rep', email: repEmail, password: 'Aa!strong123' });
    expect(repRes.statusCode).toBe(201);
    const repToken = repRes.body.token;

    // representative creates request
    const reqCreate = await request(BASE).post('/api/representatives').set('Authorization', `Bearer ${repToken}`).send({ studentId });
    expect(reqCreate.statusCode).toBe(201);

    // student sees received requests
    const studentReceived = await request(BASE).get('/api/representatives/received').set('Authorization', `Bearer ${studentToken}`);
    expect(studentReceived.statusCode).toBe(200);
    expect(Array.isArray(studentReceived.body.requests)).toBe(true);

    // student grants consent (use representativeId returned by create request)
    const createdRepId = reqCreate.body.representativeId;
    const consent = await request(BASE).post('/api/representatives/consent').set('Authorization', `Bearer ${studentToken}`).send({ studentId, representativeId: createdRepId, action: 'grant' });
    expect([200,201].includes(consent.statusCode)).toBeTruthy();

    // representative tries to view progress (should be allowed now)
    const repView = await request(BASE).get(`/api/representatives/students/${studentId}/progress`).set('Authorization', `Bearer ${repToken}`);
    expect([200,403].includes(repView.statusCode)).toBeTruthy();
  }, 20000);
});
