import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import connection from '../config/db.js';
import auth from '../middleware/auth.js';




dotenv.config();
const router = express.Router();




// Função: Validar força da senha.
function validarSenha(senha) {
    if (!senha || senha.length < 8) {
        return { ok: false, msg: 'A senha deve ter no mínimo 8 caracteres.' };
    }




    const regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;




    if (!regex.test(senha)) {
        return { ok: false, msg: 'A senha deve conter letra maiúscula, minúscula, número e símbolo.' };
    }




    return { ok: true };
}




   // Criar conta de usuário.
router.post('/', async (req, res) => {
    const { nome, email, senha } = req.body;


    console.log('Dados recebidos:', { nome, email, senha });


    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos.' });
    }




    const valid = validarSenha(senha);
    if (!valid.ok) {
        return res.status(400).json({ erro: valid.msg });
    }




    const verificarEmail = 'SELECT * FROM Usuarios WHERE email = ?';
    connection.query(verificarEmail, [email], async (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao verificar email.' });
        if (results.length > 0) {
            return res.status(400).json({ erro: 'Este email já está cadastrado.' });
        }




        try {
            const senhaCriptografada = await bcrypt.hash(senha, 10);


            const sqlInsert = `
                INSERT INTO Usuarios (nome, email, senha, status)
                VALUES (?, ?, ?, 'ativo')
            `;


            connection.query(sqlInsert, [nome, email, senhaCriptografada], (err, result) => {
                if (err) {
                    console.error('Erro ao inserir usuário:', err);
                    return res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
                }


                console.log('Usuário cadastrado com sucesso:', result);


                return res.status(201).json({
                    sucesso: true,
                    mensagem: 'Usuário cadastrado com sucesso!'
                });
            });


        } catch (erro) {
            return res.status(500).json({ erro: 'Erro interno ao processar cadastro.' });
        }
    });
});




// Login de usuário


router.post('/login', (req, res) => {
    const { email, senha } = req.body;




    if (!email || !senha) {
        return res.status(400).json({ erro: 'Informe email e senha.' });
    }




    const sql = 'SELECT * FROM Usuarios WHERE email = ?';




    connection.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao fazer login.' });




        if (results.length === 0) {
            return res.status(401).json({ erro: 'Email não encontrado.' });
        }




        const usuario = results[0];




        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Senha incorreta.' });
        }




        if (usuario.status !== 'ativo') {
            return res.status(403).json({
                erro: 'Conta pendente. Verifique seu email para ativar.'
            });
        }




        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );




        res.json({
            sucesso: true,
            mensagem: 'Login realizado!',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    });
});




   // Rota para obter dados do usuário.
router.get('/me', auth, (req, res) => {
    res.json({
        sucesso: true,
        usuario: req.user
    });
});




   // Atualizar dados do usuário (nome, email, senha).
router.put('/me', auth, async (req, res) => {
    const userId = req.user.id;
    const { nome, email, senhaAtual, novaSenha } = req.body;




    const campos = [];
    const valores = [];




    if (nome) {
        campos.push("nome = ?");
        valores.push(nome);
    }




    if (email) {
        campos.push("email = ?");
        valores.push(email);
    }




    // --- Atualizar senha - exige senha atual para validar ---
    if (senhaAtual && novaSenha) {




        const validar = validarSenha(novaSenha);
        if (!validar.ok) return res.status(400).json({ erro: validar.msg });




        const sqlBusca = "SELECT senha FROM Usuarios WHERE id = ?";
        connection.query(sqlBusca, [userId], async (err, results) => {
            if (err) return res.status(500).json({ erro: "Erro ao buscar senha." });




            const senhaCorreta = await bcrypt.compare(senhaAtual, results[0].senha);
            if (!senhaCorreta) {
                return res.status(400).json({ erro: "Senha atual incorreta." });
            }




            const hash = await bcrypt.hash(novaSenha, 10);
            campos.push("senha = ?");
            valores.push(hash);




            const sqlUpdate = `UPDATE Usuarios SET ${campos.join(", ")} WHERE id = ?`;
            valores.push(userId);




            connection.query(sqlUpdate, valores, (err) => {
                if (err) return res.status(500).json({ erro: "Erro ao atualizar senha." });




                res.json({ sucesso: true, mensagem: "Dados atualizados!" });
            });
        });




        return;
    }




    // Atualizar apenas nome/email.
    if (campos.length === 0) {
        return res.status(400).json({ erro: "Nenhuma alteração enviada." });
    }




    const sql = `UPDATE Usuarios SET ${campos.join(", ")} WHERE id = ?`;
    valores.push(userId);




    connection.query(sql, valores, (err) => {
        if (err) return res.status(500).json({ erro: "Erro ao atualizar dados." });




        res.json({ sucesso: true, mensagem: "Dados atualizados!" });
    });
});




   // Excluir conta.
router.delete('/me', auth, (req, res) => {
    const userId = req.user.id;




    const sql = "DELETE FROM Usuarios WHERE id = ?";




    connection.query(sql, [userId], (err) => {
        if (err) return res.status(500).json({ erro: "Erro ao excluir conta." });




        res.json({ sucesso: true, mensagem: "Conta excluída." });
    });
});




export default router;