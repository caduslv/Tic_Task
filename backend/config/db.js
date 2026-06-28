import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();


const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Executa o teste inicial usando o Pool adaptado
connection.query('SELECT DATABASE() AS banco', (err, result) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log(' Conexão bem-sucedida com o banco de dados MySQL!');
  console.log(' BANCO USADO PELO NODE:', result[0].banco);
});

console.log("DEBUG DB_HOST:", process.env.DB_HOST);
console.log("DEBUG DB_PORT:", process.env.DB_PORT);

export default connection;