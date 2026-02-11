import mysql from 'mysql2/promise';

const createConnectionRaw = mysql.createConnection.bind(mysql);
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartstudio_lms'
};

export const getConnection = (config = dbConfig) => createConnectionRaw(config);

export const getAdminConnection = () => mysql.createConnection({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password
});
