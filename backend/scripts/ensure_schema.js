import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartstudio_lms'
};

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(
    'SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE table_schema = ? AND table_name = ? AND column_name = ?',
    [dbConfig.database, table, column]
  );
  return rows && rows[0] && Number(rows[0].c) > 0;
}

async function tableExists(connection, table) {
  const [rows] = await connection.execute(
    'SELECT COUNT(*) as c FROM information_schema.TABLES WHERE table_schema = ? AND table_name = ?',
    [dbConfig.database, table]
  );
  return rows && rows[0] && Number(rows[0].c) > 0;
}

async function ensureSchema() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Ensure users table columns
    const userTable = 'users';
    const cols = [
      { name: 'occupation', ddl: 'ALTER TABLE users ADD COLUMN occupation VARCHAR(255) DEFAULT NULL' },
      { name: 'organization', ddl: 'ALTER TABLE users ADD COLUMN organization VARCHAR(255) DEFAULT NULL' },
      { name: 'avatar_url', ddl: "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(1024) DEFAULT NULL" },
      { name: 'tags', ddl: 'ALTER TABLE users ADD COLUMN tags JSON DEFAULT NULL' },
      { name: 'active', ddl: 'ALTER TABLE users ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1' }
    ];

    for (const c of cols) {
      const exists = await columnExists(connection, userTable, c.name);
      if (!exists) {
        console.log(`Adding column ${c.name} to ${userTable}`);
        await connection.execute(c.ddl);
      } else {
        console.log(`Column ${c.name} already exists on ${userTable}`);
      }
    }

    // Ensure audits table
    const auditsTable = 'audits';
    const auditsExists = await tableExists(connection, auditsTable);
    if (!auditsExists) {
      console.log('Creating table audits');
      await connection.execute(`
        CREATE TABLE audits (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          action VARCHAR(100) NOT NULL,
          entity VARCHAR(100) NULL,
          entity_id VARCHAR(128) NULL,
          details JSON NULL,
          ip VARCHAR(100) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } else {
      console.log('Table audits already exists');
    }

    console.log('Schema ensure complete');
    await connection.end();
  } catch (err) {
    console.error('Error ensuring schema:', err);
    if (connection) await connection.end();
    process.exitCode = 2;
  }
}

ensureSchema();
