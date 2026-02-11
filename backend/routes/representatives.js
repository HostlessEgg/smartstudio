import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { check, validationResult } from 'express-validator';
import { getConnection } from '../lib/db.js';

dotenv.config();

const router = express.Router();

// Lightweight auth middleware (duplicates server.js behavior for modular router)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies?.access_token;
  const token = headerToken || cookieToken;
  if (!token) return res.status(401).json({ error: 'Token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// POST /api/representatives - solicitar registrar como representante para un estudiante
router.post('/',
  authenticateToken,
  [ check('studentId').isInt().withMessage('studentId must be integer') ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const representativeUserId = req.user.userId; // quien solicita
    const { studentId } = req.body;

    try {
      const connection = await getConnection();
      // create or get representative entry
      const [existing] = await connection.execute('SELECT id FROM representatives WHERE user_id = ?', [representativeUserId]);
      let representativeId;
      if (existing.length > 0) {
        representativeId = existing[0].id;
      } else {
        const [r] = await connection.execute('INSERT INTO representatives (user_id) VALUES (?)', [representativeUserId]);
        representativeId = r.insertId;
      }

      // create consent request (inactive by default)
      const [consentResult] = await connection.execute(
        'INSERT INTO consents (student_id, representative_id, active, requested_at) VALUES (?, ?, false, NOW())',
        [studentId, representativeId]
      );

      // audit
      await connection.execute(
        'INSERT INTO audits (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)',
        [representativeUserId, 'representative_request', 'consent', String(consentResult.insertId), JSON.stringify({ studentId, representativeId }), req.ip || null]
      );

      await connection.end();
      res.status(201).json({ message: 'Solicitud creada', representativeId });
    } catch (err) {
      console.error('Error creando solicitud representante:', err);
      res.status(500).json({ error: 'Error interno' });
    }
  }
);

// POST /api/representatives/consent - estudiante concede/revoca consentimiento
router.post('/consent',
  authenticateToken,
  [ check('studentId').isInt(), check('representativeId').isInt(), check('action').isIn(['grant','revoke']) ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { studentId, representativeId, action, expiresAt } = req.body;

    // Only the student themselves may grant/revoke consent
    if (!req.user || req.user.userId !== Number(studentId)) return res.status(403).json({ error: 'Only the student can grant/revoke consent' });

    try {
      const connection = await getConnection();
      if (action === 'grant') {
        // set active true and set granted_by
        await connection.execute(
          `UPDATE consents SET active = true, granted_by = ?, granted_at = NOW(), expires_at = ? WHERE representative_id = ? AND student_id = ?`,
          [studentId, expiresAt || null, representativeId, studentId]
        );

        await connection.execute(
          'INSERT INTO audits (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)',
          [studentId, 'representative_consent_grant', 'consent', String(representativeId), JSON.stringify({ representativeId, studentId }), req.ip || null]
        );
      } else {
        await connection.execute(
          `UPDATE consents SET active = false, expires_at = NOW() WHERE representative_id = ? AND student_id = ?`,
          [representativeId, studentId]
        );

        await connection.execute(
          'INSERT INTO audits (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)',
          [studentId, 'representative_consent_revoke', 'consent', String(representativeId), JSON.stringify({ representativeId, studentId }), req.ip || null]
        );
      }
      await connection.end();
      res.json({ message: `Consent ${action}ed` });
    } catch (err) {
      console.error('Error actualizando consent:', err);
      res.status(500).json({ error: 'Error interno' });
    }
  }
);

// GET /api/representatives/students - listar estudiantes con consentimiento activo
router.get('/students', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    const requester = req.user;

    const [repRows] = await connection.execute('SELECT id FROM representatives WHERE user_id = ?', [requester.userId]);
    if (repRows.length === 0) {
      await connection.end();
      return res.status(403).json({ error: 'No representative profile' });
    }

    const repId = repRows[0].id;
    const [rows] = await connection.execute(
      `SELECT c.student_id, u.name, u.email, c.active, c.granted_at, c.expires_at
       FROM consents c
       JOIN users u ON u.id = c.student_id
       WHERE c.representative_id = ? AND c.active = 1
       ORDER BY c.granted_at DESC`,
      [repId]
    );
    await connection.end();
    res.json({ representativeId: repId, students: rows });
  } catch (err) {
    console.error('Error listando estudiantes del representante:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/representatives/students/:studentId/progress - ver progreso si tiene consentimiento
router.get('/students/:studentId/progress', authenticateToken, async (req, res) => {
  const studentId = Number(req.params.studentId);
  const requester = req.user;

  try {
    const connection = await getConnection();

    // Allow if requester is admin or teacher
    if (requester && (requester.role === 'admin' || requester.role === 'teacher' || requester.userId === studentId)) {
      const [rows] = await connection.execute('SELECT course_id, COUNT(*) as completed_lessons FROM student_progress WHERE student_id = ? GROUP BY course_id', [studentId]);
      await connection.end();
      return res.json({ studentId, progress: rows });
    }

    // Otherwise check consent: find representative record linked to requester
    const [repRows] = await connection.execute('SELECT id FROM representatives WHERE user_id = ?', [requester.userId]);
    if (repRows.length === 0) {
      await connection.end();
      return res.status(403).json({ error: 'No consent found' });
    }
    const repId = repRows[0].id;
    const [consentRows] = await connection.execute('SELECT * FROM consents WHERE student_id = ? AND representative_id = ? AND active = 1', [studentId, repId]);
    if (consentRows.length === 0) {
      await connection.end();
      return res.status(403).json({ error: 'Consent not active' });
    }

    const [rows] = await connection.execute('SELECT course_id, COUNT(*) as completed_lessons FROM student_progress WHERE student_id = ? GROUP BY course_id', [studentId]);

    // Log access in representative_access_logs
    await connection.execute('INSERT INTO representative_access_logs (representative_id, student_id, action, details, ip) VALUES (?, ?, ?, ?, ?)', [repId, studentId, 'view_progress', JSON.stringify({ by: requester.userId }), req.ip || null]);

    // Audit log
    await connection.execute(
      'INSERT INTO audits (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)',
      [requester.userId, 'representative_view_progress', 'student', String(studentId), JSON.stringify({ representativeId: repId }), req.ip || null]
    );

    await connection.end();
    res.json({ studentId, progress: rows });
  } catch (err) {
    console.error('Error obteniendo progreso por representante:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/representatives/requests - obtener solicitudes hechas por el requester (representante)
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    const requester = req.user;
    // must be a representative user
    const [repRows] = await connection.execute('SELECT id FROM representatives WHERE user_id = ?', [requester.userId]);
    if (repRows.length === 0) {
      await connection.end();
      return res.status(403).json({ error: 'No representative profile' });
    }
    const repId = repRows[0].id;
    const [rows] = await connection.execute(
      `SELECT c.id, c.student_id, u.name AS student_name, u.email AS student_email, c.active, c.requested_at, c.granted_at, c.expires_at
       FROM consents c
       JOIN users u ON u.id = c.student_id
       WHERE c.representative_id = ?
       ORDER BY c.requested_at DESC`,
      [repId]
    );
    await connection.end();
    res.json({ representativeId: repId, requests: rows });
  } catch (err) {
    console.error('Error listando requests del representante:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/representatives/received - obtener solicitudes recibidas por el estudiante (pending/active)
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    const studentId = req.user.userId;
    const [rows] = await connection.execute(
      `SELECT c.id, c.representative_id, r.user_id as representative_user_id, u.name as representative_name, u.email as representative_email,
              c.active, c.requested_at, c.granted_at, c.expires_at
       FROM consents c
       JOIN representatives r ON c.representative_id = r.id
       JOIN users u ON r.user_id = u.id
       WHERE c.student_id = ?
       ORDER BY c.requested_at DESC`,
      [studentId]
    );
    await connection.end();
    res.json({ studentId, requests: rows });
  } catch (err) {
    console.error('Error obteniendo solicitudes recibidas:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/representatives/:id/cancel - representante cancela su solicitud
router.delete('/:repId/cancel', authenticateToken, async (req, res) => {
  const repIdParam = Number(req.params.repId);
  const requesterId = req.user.userId;
  try {
    const connection = await getConnection();
    // verify representative ownership
    const [repRows] = await connection.execute('SELECT id FROM representatives WHERE id = ? AND user_id = ?', [repIdParam, requesterId]);
    if (repRows.length === 0) {
      await connection.end();
      return res.status(403).json({ error: 'No autorizado para cancelar esta solicitud' });
    }
    // delete pending consents for this representative
    const [del] = await connection.execute('DELETE FROM consents WHERE representative_id = ? AND active = 0', [repIdParam]);
    // log audit entry
    await connection.execute('INSERT INTO audits (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)', [requesterId, 'cancel_representative_requests', 'representative', repIdParam, JSON.stringify({ deleted: del.affectedRows }), req.ip || null]);
    await connection.end();
    res.json({ message: 'Solicitudes pendientes canceladas', deleted: del.affectedRows });
  } catch (err) {
    console.error('Error cancelando solicitudes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
