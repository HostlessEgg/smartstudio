const request = require('supertest');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function registerUser(name, email, role = 'student') {
  const password = 'StrongP@ssw0rd!1';
  const res = await request(BASE).post('/api/auth/register').send({ name, email, password, role });
  return { res, token: res.body?.token, user: res.body?.user };
}

describe('Submissions endpoints', () => {
  jest.setTimeout(20000);

  test('Student submits assignment and teacher grades it', async () => {
    // Register teacher
    const tEmail = `teach${Date.now()}@example.com`;
    const { res: tRes, token: tToken } = await registerUser('Teacher S', tEmail, 'teacher');
    expect(tRes.statusCode).toBe(201);

    // Create an assignment as teacher
    const assignPayload = { title: 'Homework 1', description: 'Do stuff', start_at: new Date().toISOString().slice(0,19).replace('T',' ')};
    const assignRes = await request(BASE).post('/api/assignments').set('Authorization', `Bearer ${tToken}`).send(assignPayload);
    expect(assignRes.statusCode).toBe(201);
    const assignmentId = assignRes.body.id || assignRes.body.insertId;

    // Register student
    const sEmail = `stud${Date.now()}@example.com`;
    const { res: sRes, token: sToken, user: sUser } = await registerUser('Student S', sEmail, 'student');
    expect(sRes.statusCode).toBe(201);

    // Student submit
    const subRes = await request(BASE).post(`/api/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${sToken}`).send({ text_submission: 'My answer' });
    expect(subRes.statusCode).toBe(201);
    expect(subRes.body).toHaveProperty('submissionId');
    const submissionId = subRes.body.submissionId;

    // Teacher lists submissions
    const listRes = await request(BASE).get(`/api/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${tToken}`);
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    const found = listRes.body.find(s => Number(s.id) === Number(submissionId));
    expect(found).toBeDefined();

    // Teacher grades submission
    const gradeRes = await request(BASE).post(`/api/submissions/${submissionId}/grade`).set('Authorization', `Bearer ${tToken}`).send({ score: 9.5, feedback: 'Good job' });
    expect(gradeRes.statusCode).toBe(200);

    // Student fetches their submission
    const viewRes = await request(BASE).get(`/api/submissions/${submissionId}`).set('Authorization', `Bearer ${sToken}`);
    expect(viewRes.statusCode).toBe(200);
    expect(Number(viewRes.body.score)).toBeCloseTo(9.5);
  });

});
