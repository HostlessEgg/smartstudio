const request = require('supertest');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Quizzes & Forums basic protections', () => {
  test('creating quiz without auth should be 401', async () => {
    const res = await request(BASE)
      .post('/api/quizzes')
      .send({ lessonId: 1, title: 'Test Quiz' });
    expect(res.statusCode).toBe(401);
  });

  test('submitting quiz without auth should be 401', async () => {
    const res = await request(BASE)
      .post('/api/quizzes/1/submit')
      .send({ answers: [] });
    expect(res.statusCode).toBe(401);
  });

  test('posting to forum thread without auth should be 401', async () => {
    const res = await request(BASE)
      .post('/api/forums/threads/1/posts')
      .send({ content: 'Hello' });
    expect(res.statusCode).toBe(401);
  });
});
