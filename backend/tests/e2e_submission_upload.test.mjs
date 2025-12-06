import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../server.js';

const TEACHER_EMAIL = 'e2e_teacher+auto@example.com';
const STUDENT_EMAIL = 'e2e_student+auto@example.com';
const PASSWORD = 'StrongP@ssw0rd!';
const COURSE_TITLE = 'E2E Auto Course';
const ASSIGN_TITLE = 'E2E Auto Assignment';

async function getToken(agent, email, name, role) {
  // try login
  let res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status === 200 && res.body.token) return res.body.token;
  // try register
  res = await agent.post('/api/auth/register').send({ name, email, password: PASSWORD, role });
  if (res.status === 201 && res.body.token) return res.body.token;
  // maybe user exists but login failed due to other reason: try login again
  res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status === 200 && res.body.token) return res.body.token;
  throw new Error('Could not obtain token for ' + email + ' (status: ' + res.status + ')');
}

describe('E2E: upload fallback + submission flow', () => {
  jest.setTimeout(30000);
  const agent = request(app);
  let teacherToken, studentToken, courseId, assignId, submissionId, uploadFilePath;

  beforeAll(async () => {
    teacherToken = await getToken(agent, TEACHER_EMAIL, 'E2E Teacher', 'teacher');
    studentToken = await getToken(agent, STUDENT_EMAIL, 'E2E Student', 'student');

    // create course
    let res = await agent.post('/api/courses').set('Authorization', `Bearer ${teacherToken}`).send({ title: COURSE_TITLE });
    if (res.status === 201) courseId = res.body.course.id || res.body.id;
    if (!courseId) {
      // find existing
      res = await agent.get('/api/my-courses').set('Authorization', `Bearer ${teacherToken}`);
      const found = (res.body || []).find(c => c.title === COURSE_TITLE);
      courseId = found && found.id;
    }

    // create assignment
    const now = new Date();
    const nowStr = now.toISOString().slice(0,19).replace('T',' ');
    const later = new Date(now.getTime() + 2*60*60*1000);
    const laterStr = later.toISOString().slice(0,19).replace('T',' ');

    res = await agent.post('/api/assignments').set('Authorization', `Bearer ${teacherToken}`).send({ title: ASSIGN_TITLE, description: 'E2E test', start_at: nowStr, end_at: laterStr, course_id: Number(courseId) });
    if (res.status === 201) assignId = res.body.id;
    if (!assignId) {
      // try find
      res = await agent.get('/api/assignments').set('Authorization', `Bearer ${teacherToken}`);
      const found = (res.body || []).find(a => a.title === ASSIGN_TITLE && a.course_id == courseId);
      assignId = found && found.id;
    }
  });

  test('upload fallback and submit', async () => {
    expect(courseId).toBeTruthy();
    expect(assignId).toBeTruthy();

    // enroll student
    let res = await agent.post(`/api/courses/${courseId}/enroll`).set('Authorization', `Bearer ${studentToken}`);
    expect([200,201,409]).toContain(res.status);

    // request presign (student request)
    res = await agent.post('/api/uploads/presign').set('Authorization', `Bearer ${studentToken}`).send({ filename: 'e2e_test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(200);
    const body = res.body;
    if (body.fallback) {
      // fallback: upload multipart
      uploadFilePath = path.join(process.cwd(), 'backend', 'tests', 'tmp_e2e_upload.txt');
      fs.writeFileSync(uploadFilePath, 'e2e file content\n');
      const upRes = await agent.post(body.uploadEndpoint || '/api/uploads').set('Authorization', `Bearer ${studentToken}`).attach('file', uploadFilePath);
      expect(upRes.status === 201 || upRes.status === 200).toBeTruthy();
      const fileUrl = upRes.body.fileUrl;
      expect(fileUrl).toBeTruthy();

      // submit assignment
      const submitRes = await agent.post(`/api/assignments/${assignId}/submissions`).set('Authorization', `Bearer ${studentToken}`).send({ text_submission: 'E2E upload', file_url: fileUrl });
      expect(submitRes.status).toBe(201);
      submissionId = submitRes.body.submissionId || submitRes.body.id;
      expect(submissionId).toBeTruthy();
    } else {
      // S3 path - not expected in CI, but handle
      const uploadUrl = body.uploadUrl; const fileUrl = body.fileUrl;
      expect(uploadUrl).toBeTruthy();
      // cannot perform real PUT in CI easily without AWS, so skip actual upload
      const submitRes = await agent.post(`/api/assignments/${assignId}/submissions`).set('Authorization', `Bearer ${studentToken}`).send({ text_submission: 'E2E no-s3', file_url: fileUrl });
      expect(submitRes.status).toBe(201);
      submissionId = submitRes.body.submissionId || submitRes.body.id;
    }

    // teacher lists submissions
    const listRes = await agent.get(`/api/assignments/${assignId}/submissions`).set('Authorization', `Bearer ${teacherToken}`);
    expect(listRes.status).toBe(200);
    const found = (listRes.body || []).find(s => Number(s.id) === Number(submissionId) || Number(s.submissionId) === Number(submissionId));
    expect(found).toBeTruthy();

    // teacher grades submission
    const gradeRes = await agent.post(`/api/submissions/${submissionId}/grade`).set('Authorization', `Bearer ${teacherToken}`).send({ score: 8.5, feedback: 'E2E good' });
    expect(gradeRes.status).toBe(200);

    // student fetches submission
    const viewRes = await agent.get(`/api/submissions/${submissionId}`).set('Authorization', `Bearer ${studentToken}`);
    expect(viewRes.status).toBe(200);
    expect(viewRes.body.score).toBeTruthy();
  });

  afterAll(async () => {
    if (uploadFilePath && fs.existsSync(uploadFilePath)) fs.unlinkSync(uploadFilePath);
  });
});
