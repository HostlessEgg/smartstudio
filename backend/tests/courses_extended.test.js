const request = require('supertest');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function registerUser(name, email, role = 'teacher') {
  const password = 'StrongP@ssw0rd!1';
  const res = await request(BASE).post('/api/auth/register').send({ name, email, password, role });
  return { res, token: res.body?.token, user: res.body?.user };
}

describe('Courses extended - nested creation', () => {
  jest.setTimeout(20000);

  test('Create nested course with modules and lessons (happy path)', async () => {
    const unique = Date.now();
    const email = `teacher${unique}@example.com`;
    const { res: regRes, token } = await registerUser('Teacher Test', email, 'teacher');
    expect(regRes.statusCode).toBe(201);
    expect(token).toBeDefined();

    const payload = {
      title: `Nested Course ${unique}`,
      description: 'Course with modules and lessons',
      category: 'programming',
      level: 'beginner',
      modules: [
        {
          title: 'Module One',
          description: 'First module',
          order_index: 1,
          lessons: [
            { title: 'Lesson 1', lesson_type: 'text', content: 'Content 1', order_index: 1 },
            { title: 'Lesson 2', lesson_type: 'video', video_url: 'https://example.com/video.mp4', order_index: 2 }
          ]
        },
        {
          title: 'Module Two',
          description: 'Second module',
          order_index: 2,
          lessons: [
            { title: 'Lesson A', lesson_type: 'text', content: 'A', order_index: 1 }
          ]
        }
      ]
    };

    const createRes = await request(BASE).post('/api/courses').set('Authorization', `Bearer ${token}`).send(payload);
    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toHaveProperty('course');
    const course = createRes.body.course;
    expect(course).toHaveProperty('id');
    expect(Array.isArray(course.modules)).toBe(true);
    expect(course.modules.length).toBe(2);

    // Fetch course detail to ensure modules/lessons exist via API
    const fetchRes = await request(BASE).get(`/api/courses/${course.id}`).set('Authorization', `Bearer ${token}`);
    expect(fetchRes.statusCode).toBe(200);
    const fetched = fetchRes.body;
    expect(fetched).toHaveProperty('modules');
    expect(Array.isArray(fetched.modules)).toBe(true);
    // Ensure lessons included
    expect(fetched.modules[0]).toHaveProperty('lessons');
    expect(Array.isArray(fetched.modules[0].lessons)).toBe(true);
  });

  test('Create course with invalid lesson_type should return 400 and not create', async () => {
    const unique = Date.now() + 1;
    const email = `teacher${unique}@example.com`;
    const { res: regRes, token } = await registerUser('Teacher Test 2', email, 'teacher');
    expect(regRes.statusCode).toBe(201);

    const payload = {
      title: `Bad Course ${unique}`,
      modules: [
        {
          title: 'Module Bad',
          lessons: [ { title: 'Bad Lesson', lesson_type: 'unknown_type' } ]
        }
      ]
    };

    const createRes = await request(BASE).post('/api/courses').set('Authorization', `Bearer ${token}`).send(payload);
    expect(createRes.statusCode).toBe(400);
    expect(createRes.body).toHaveProperty('error');
  });

  test('Create course without modules should succeed (legacy behavior)', async () => {
    const unique = Date.now() + 2;
    const email = `teacher${unique}@example.com`;
    const { res: regRes, token } = await registerUser('Teacher Test 3', email, 'teacher');
    expect(regRes.statusCode).toBe(201);

    const payload = {
      title: `Simple Course ${unique}`,
      description: 'No modules here'
    };

    const createRes = await request(BASE).post('/api/courses').set('Authorization', `Bearer ${token}`).send(payload);
    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toHaveProperty('course');
    expect(Array.isArray(createRes.body.course.modules)).toBe(true);
  });

});
