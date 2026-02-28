import mysql from 'mysql2';
import dotenv from 'dotenv';




dotenv.config();




const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});




connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão bem-sucedida com o banco de dados MySQL!');
});


connection.query('SELECT DATABASE() AS banco', (err, result) => {
  console.log('📦 BANCO USADO PELO NODE:', result[0].banco);
});


export default connection;