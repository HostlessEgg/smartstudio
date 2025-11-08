import mysql from 'mysql2/promise';

async function testDB() {
  try {
    console.log('🔍 Probando conexión a MySQL...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''  // Si tienes contraseña, ponla aquí
    });
    
    console.log('✅ CONEXIÓN EXITOSA a MySQL');
    
    // Verificar bases de datos
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📊 Bases de datos encontradas:');
    databases.forEach(db => console.log('   -', db.Database));
    
    // Verificar específicamente smartstudio_lms
    const dbExists = databases.some(db => db.Database === 'smartstudio_lms');
    console.log('🔍 smartstudio_lms existe:', dbExists ? '✅ SÍ' : '❌ NO');
    
    await connection.end();
    
  } catch (error) {
    console.log('❌ ERROR de conexión:');
    console.log('   Mensaje:', error.message);
    console.log('   Código:', error.code);
  }
}

testDB();