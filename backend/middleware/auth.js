import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import connection from '../config/db.js';




dotenv.config();




export default function auth(req, res, next) {
    const authHeader = req.headers.authorization;




    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não fornecido.' });
    }




    const token = authHeader.split(' ')[1];




    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);




        const sql = 'SELECT id, nome, email, status FROM Usuarios WHERE id = ?';
        connection.query(sql, [decoded.id], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
            }




            if (results.length === 0) {
                return res.status(401).json({ erro: 'Usuário não encontrado.' });
            }




            const usuario = results[0];




            if (usuario.status !== 'ativo') {
                return res.status(403).json({
                    erro: 'Conta não está ativa. Verifique seu email para ativação.'
                });
            }




            req.user = usuario;
            next();
        });




    } catch (err) {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}



