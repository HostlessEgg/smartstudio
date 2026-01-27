import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

async function main() {
  const {
    DB_HOST = '127.0.0.1',
    DB_PORT = '3306',
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_NAME = 'smartstudio_lms',
  } = process.env;

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log('🔧 Ensuring database exists and selecting it...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.query(`USE \`${DB_NAME}\``);

    // Apply base schema if first-time setup
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'users'"
    );
    const schemaPath = path.resolve(
      path.join(process.cwd(), '..', 'database', 'schema.sql')
    );
    if (tables.length === 0 && fs.existsSync(schemaPath)) {
      console.log('📜 Applying base schema from database/schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
    } else {
      // Even if not empty, schema uses IF NOT EXISTS; safe to re-apply if desired
      // Skipping by default to speed-up repeated runs
      console.log('✅ Base schema seems present; skipping full schema apply');
    }

    console.log('🧭 Ensuring migrations table exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.resolve(
      path.join(process.cwd(), '..', 'database', 'migrations')
    );
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️ No migrations directory found, nothing to run.');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`🔎 Found ${files.length} migration files`);

    for (const fname of files) {
      const [rows] = await connection.query(
        'SELECT filename FROM migrations WHERE filename = ? LIMIT 1',
        [fname]
      );
      if (rows.length > 0) {
        console.log(`⏭️  Skipping already applied migration: ${fname}`);
        continue;
      }

      const fullPath = path.join(migrationsDir, fname);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`⬆️  Applying migration: ${fname}`);
      try {
        await connection.query(sql);
        await connection.query('INSERT INTO migrations (filename) VALUES (?)', [fname]);
        console.log(`✅ Applied: ${fname}`);
      } catch (err) {
        console.error(`❌ Failed applying ${fname}:`, err.message);
        throw err;
      }
    }

    console.log('🎉 All migrations applied');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
