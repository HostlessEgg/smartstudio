import { getConnection } from './db.js';

export async function logAudit(req, action, entity = null, entityId = null, details = null) {
  try {
    const connection = await getConnection();
    const userId = req.user ? req.user.userId : null;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;
    await connection.execute(
      'INSERT INTO audits (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entity, entityId ? String(entityId) : null, details ? JSON.stringify(details) : null, ip]
    );
    await connection.end();
  } catch (err) {
    console.error('Error registrando auditoría:', err);
  }
}
