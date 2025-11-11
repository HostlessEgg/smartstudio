import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  enrollSingle,
  listCourseStudents,
  unenroll,
  bulkEnrollController
} from '../controllers/enrollmentController.js';

const r = Router();

r.get('/courses/:courseId/students', auth, requireRole(['teacher','admin']), listCourseStudents);
r.post('/courses/:courseId/enroll', auth, requireRole(['admin','teacher']), enrollSingle);
r.post('/courses/:courseId/enroll/bulk', auth, requireRole(['admin']), bulkEnrollController);
r.delete('/courses/:courseId/enroll/:userId', auth, requireRole(['admin']), unenroll);

export default r;