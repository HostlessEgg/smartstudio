import 'dotenv/config';
import app from './src/app.js';
import { testDB } from './src/db/mysql.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('Falta JWT_SECRET en .env');
      process.exit(1);
    }
    await testDB();
    app.listen(PORT, () => {
      console.log(`Backend listo en http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Error iniciando servidor:', e.message);
    process.exit(1);
  }
}

start();