import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  // Estándar de configuración: DB_PASSWORD (DB_PASS queda como fallback temporal)
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testDB() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}