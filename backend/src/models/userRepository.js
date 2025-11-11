import { pool } from '../db/mysql.js';

export async function getUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [id]);
  return rows[0] || null;
}

export async function getUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
  return rows[0] || null;
}