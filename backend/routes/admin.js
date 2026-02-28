// routes/admin.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import connection from "../config/db.js";
import adminAuth from "../middleware/adminAuth.js";


dotenv.config();
const router = express.Router();


//  Criar administrador (somente outro admin)
router.post("/criar", adminAuth, async (req, res) => {
    const { nome, email, senha } = req.body;


    if (!nome || !email || !senha)
        return res.status(400).json({ erro: "Preencha nome, email e senha." });


    try {
        // Verificar se e-mail já existe
        const sqlCheck = "SELECT id FROM Administradores WHERE email = ?";
        connection.query(sqlCheck, [email], async (err, results) => {
            if (err) return res.status(500).json({ erro: "Erro ao verificar email." });


            if (results.length > 0)
                return res.status(400).json({ erro: "Este email já está em uso." });


            const hash = await bcrypt.hash(senha, 10);


            const sql = `
                INSERT INTO Administradores (nome, email, senha)
                VALUES (?, ?, ?)
            `;


            connection.query(sql, [nome, email, hash], (err, result) => {
                if (err) return res.status(500).json({ erro: "Erro ao criar administrador." });


                res.status(201).json({
                    sucesso: true,
                    mensagem: "Administrador criado com sucesso!",
                    id: result.insertId
                });
            });
        });
    } catch (erro) {
        return res.status(500).json({ erro: "Erro interno ao criar administrador." });
    }
});


// Login de administrador
router.post("/login", (req, res) => {
    const { email, senha } = req.body;


    if (!email || !senha)
        return res.status(400).json({ erro: "Email e senha são obrigatórios." });


    const sql = "SELECT * FROM Administradores WHERE email = ?";


    connection.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro no login." });


        if (results.length === 0)
            return res.status(404).json({ erro: "Administrador não encontrado." });


        const admin = results[0];


        const ok = await bcrypt.compare(senha, admin.senha);
        if (!ok) return res.status(401).json({ erro: "Senha incorreta." });


        const token = jwt.sign(
            { id: admin.id, email: admin.email, tipo: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );


        res.json({
            sucesso: true,
            token,
            admin: {
                id: admin.id,
                nome: admin.nome,
                email: admin.email
            }
        });
    });
});


//  mostrar administradores (somente para admins) - sem senha
router.get("/", adminAuth, (req, res) => {
    const sql = `SELECT id, nome, email, criado_em FROM Administradores`;


    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro ao listar admins." });
        res.json(results);
    });
});


// Criar categoria global (visível para todos os usuários)
router.post("/categorias/global", adminAuth, (req, res) => {
    const { nome } = req.body;


    if (!nome) return res.status(400).json({ erro: "Nome da categoria é obrigatório." });


    const sql = `
        INSERT INTO Categorias (nome, admin_id, global)
        VALUES (?, ?, TRUE)
    `;


    connection.query(sql, [nome, req.admin.id], (err, result) => {
        if (err) return res.status(500).json({ erro: "Erro ao criar categoria global." });


        res.status(201).json({
            sucesso: true,
            categoria: { id: result.insertId, nome }
        });
    });
});


// Listar categorias (globais e criadas por este admin)
router.get("/categorias", adminAuth, (req, res) => {
    const sql = `
        SELECT
            c.id, c.nome, c.global,
            u.nome AS criador_usuario,
            a.nome AS criador_admin
        FROM Categorias c
        LEFT JOIN Usuarios u ON c.usuario_id = u.id
        LEFT JOIN Administradores a ON c.admin_id = a.id
    `;


    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro ao buscar categorias." });
        res.json(results);
    });
});


// enviar notificação para um usuário específico ou para todos (se usuario_id for null)
router.post("/notificacoes", adminAuth, (req, res) => {
    const { usuario_id, titulo, mensagem, tipo } = req.body;


    if (!titulo || !mensagem)
        return res.status(400).json({ erro: "Título e mensagem são obrigatórios." });


    const sql = `
        INSERT INTO Notificacoes (usuario_id, admin_id, titulo, mensagem, tipo)
        VALUES (?, ?, ?, ?, ?)
    `;


    connection.query(
        sql,
        [usuario_id || null, req.admin.id, titulo, mensagem, tipo || "sistema"],
        (err, result) => {
            if (err) return res.status(500).json({ erro: "Erro ao enviar notificação." });


            res.status(201).json({
                sucesso: true,
                id: result.insertId,
                mensagem: "Notificação enviada!"
            });
        }
    );
});


//  listar notificações enviadas (com detalhes do usuário e admin, se aplicável)
router.get("/notificacoes", adminAuth, (req, res) => {
    const sql = `
        SELECT n.*,
               u.nome AS usuario_nome,
               a.nome AS admin_nome
        FROM Notificacoes n
        LEFT JOIN Usuarios u ON n.usuario_id = u.id
        LEFT JOIN Administradores a ON n.admin_id = a.id
        ORDER BY n.data_envio DESC
    `;


    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro ao listar notificações." });
        res.json(results);
    });
});


export default router;