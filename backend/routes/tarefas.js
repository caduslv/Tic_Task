// routes/tarefas.js
import express from 'express';
import connection from '../config/db.js';
import auth from '../middleware/auth.js';




const router = express.Router();




// Helpers
const PRIORIDADES = ['baixa', 'media', 'alta'];
const STATUS_VALIDOS = ['pendente', 'andamento', 'concluida'];




function validarPrioridade(p) {
    return !p || PRIORIDADES.includes(p);
}




function validarStatus(s) {
    return !s || STATUS_VALIDOS.includes(s);
}




// Criar tarefa (somente se o usuário estiver logado)




router.post('/', auth, (req, res) => {
    const { titulo, descricao, prazo_execucao, prioridade, categoria_id } = req.body;
    const usuarioId = req.user.id;




    if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' });
    if (!validarPrioridade(prioridade)) return res.status(400).json({ erro: 'Prioridade inválida.' });




    if (prazo_execucao) {
        const prazo = new Date(prazo_execucao);
        if (isNaN(prazo)) return res.status(400).json({ erro: 'Prazo inválido.' });
        if (prazo < new Date()) return res.status(400).json({ erro: 'Prazo não pode ser anterior à data atual.' });
    }




    // Validar categoria do usuário
    const validarCategoria = (cb) => {
        if (!categoria_id) return cb(null);




        const sql = `SELECT id, usuario_id, global FROM Categorias WHERE id = ?`;
        connection.query(sql, [categoria_id], (err, results) => {
            if (err) return cb({ status: 500, msg: 'Erro ao validar categoria.' });
            if (results.length === 0) return cb({ status: 400, msg: 'Categoria não encontrada.' });




            const cat = results[0];




            if (cat.global || cat.usuario_id === usuarioId) return cb(null);




            return cb({ status: 403, msg: 'Categoria não permitida.' });
        });
    };




    validarCategoria((catErr) => {
        if (catErr) return res.status(catErr.status).json({ erro: catErr.msg });




        const sql = `
            INSERT INTO Tarefas
                (titulo, descricao, prazo_execucao, status, prioridade, usuario_id, categoria_id)
            VALUES
                (?, ?, ?, 'pendente', ?, ?, ?)
        `;




        connection.query(sql, [
            titulo,
            descricao || null,
            prazo_execucao || null,
            prioridade || 'media',
            usuarioId,
            categoria_id || null
        ], (err, result) => {
            if (err) return res.status(500).json({ erro: 'Erro ao criar tarefa.' });




            res.status(201).json({
                sucesso: true,
                id: result.insertId,
                mensagem: 'Tarefa criada.'
            });
        });
    });
});




// Listar tarefas do usuário com filtros, ordenação e paginação




router.get('/', auth, (req, res) => {
    const usuarioId = req.user.id;
    const { status, prioridade, categoria_id, q, ordenar, page = 1, limit = 50 } = req.query;




    const where = ['t.usuario_id = ?'];
    const valores = [usuarioId];




    // Filtro por status
    if (status) {
        if (status === 'vencida') {
            where.push('t.prazo_execucao < NOW() AND t.prazo_execucao IS NOT NULL AND t.status = "pendente"');
        } else if (STATUS_VALIDOS.includes(status)) {
            where.push('t.status = ?');
            valores.push(status);
        } else {
            return res.status(400).json({ erro: 'Status inválido.' });
        }
    }




    // Prioridade
    if (prioridade) {
        if (!PRIORIDADES.includes(prioridade))
            return res.status(400).json({ erro: 'Prioridade inválida.' });




        where.push('t.prioridade = ?');
        valores.push(prioridade);
    }




    // Categoria
    if (categoria_id) {
        where.push('t.categoria_id = ?');
        valores.push(categoria_id);
    }




    // Busca textual
    if (q) {
        where.push('t.titulo LIKE ?');
        valores.push(`%${q}%`);
    }




    // Ordenação
    let orderBy = 'ORDER BY t.data_criacao DESC';




    if (ordenar === 'prazo') {
        orderBy = 'ORDER BY (t.prazo_execucao IS NULL), t.prazo_execucao ASC';
    }




    if (ordenar === 'prioridade') {
        orderBy = "ORDER BY FIELD(t.prioridade, 'alta', 'media', 'baixa')";
    }




    if (ordenar === 'concluidas') {
        orderBy = 'ORDER BY t.data_conclusao DESC';
    }




    const offset = (Number(page) - 1) * Number(limit);




    const sql = `
        SELECT
            t.id, t.titulo, t.descricao, t.prazo_execucao, t.status,
            t.prioridade, t.data_criacao, t.data_conclusao,
            t.categoria_id, c.nome AS categoria
        FROM Tarefas t
        LEFT JOIN Categorias c ON t.categoria_id = c.id
        WHERE ${where.join(' AND ')}
        ${orderBy}
        LIMIT ? OFFSET ?
    `;




    valores.push(Number(limit), Number(offset));




    connection.query(sql, valores, (err, results) => {
        if (err) {
            console.error('Erro listar tarefas:', err);
            return res.status(500).json({ erro: 'Erro ao listar tarefas.' });
        }
        res.json(results);
    });
});




// GET por ID




router.get('/:id', auth, (req, res) => {
    const sql = `SELECT * FROM Tarefas WHERE id = ? AND usuario_id = ?`;




    connection.query(sql, [req.params.id, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar tarefa.' });
        if (results.length === 0) return res.status(404).json({ erro: 'Tarefa não encontrada.' });




        res.json(results[0]);
    });
});




// Atualizar tarefa (somente se o usuário estiver logado)




router.patch('/:id', auth, (req, res) => {
    const { titulo, descricao, prazo_execucao, prioridade, status, categoria_id } = req.body;
    const usuarioId = req.user.id;




    const campos = [];
    const valores = [];




    if (titulo) { campos.push('titulo = ?'); valores.push(titulo); }
    if (descricao) { campos.push('descricao = ?'); valores.push(descricao); }




    // Prazo
    if (prazo_execucao) {
        const prazo = new Date(prazo_execucao);
        if (isNaN(prazo)) return res.status(400).json({ erro: 'Prazo inválido.' });
        campos.push('prazo_execucao = ?');
        valores.push(prazo_execucao);
    }




    // Prioridade
    if (prioridade) {
        if (!PRIORIDADES.includes(prioridade))
            return res.status(400).json({ erro: 'Prioridade inválida.' });




        campos.push('prioridade = ?');
        valores.push(prioridade);
    }




    // Status — agora aceita ANDAMENTO
    if (status) {
        if (!STATUS_VALIDOS.includes(status))
            return res.status(400).json({ erro: 'Status inválido.' });




        campos.push('status = ?');
        valores.push(status);




        // Se concluída -> seta data_conclusao
        if (status === 'concluida') {
            campos.push('data_conclusao = NOW()');
        } else {
            campos.push('data_conclusao = NULL');
        }
    }




    if (campos.length === 0 && categoria_id === undefined)
        return res.status(400).json({ erro: 'Nada para atualizar.' });




    // Validação categoria
    const aplicarUpdate = (categoriaPermitida = true) => {
        if (!categoriaPermitida)
            return res.status(403).json({ erro: 'Categoria não permitida.' });




        const sql = `
            UPDATE Tarefas SET
            ${campos.join(', ')}
            ${categoria_id !== undefined ? ', categoria_id = ?' : ''}
            WHERE id = ? AND usuario_id = ?
        `;




        if (categoria_id !== undefined) valores.push(categoria_id);




        valores.push(req.params.id, usuarioId);




        connection.query(sql, valores, (err, result) => {
            if (err) return res.status(500).json({ erro: 'Erro ao atualizar tarefa.' });
            if (result.affectedRows === 0) return res.status(404).json({ erro: 'Tarefa não encontrada.' });




            res.json({ sucesso: true, mensagem: 'Tarefa atualizada.' });
        });
    };




    if (categoria_id !== undefined) {
        if (categoria_id === null) return aplicarUpdate(true);




        const sqlCat = `SELECT id, usuario_id, global FROM Categorias WHERE id = ?`;
        connection.query(sqlCat, [categoria_id], (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao validar categoria.' });
            if (results.length === 0) return res.status(400).json({ erro: 'Categoria não encontrada.' });




            const cat = results[0];
            aplicarUpdate(cat.global || cat.usuario_id === usuarioId);
        });
    } else {
        aplicarUpdate(true);
    }
});




// Excluir tarefa (somente se o usuário estiver logado)




router.delete('/:id', auth, (req, res) => {
    const sql = `DELETE FROM Tarefas WHERE id = ? AND usuario_id = ?`;




    connection.query(sql, [req.params.id, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ erro: 'Erro ao excluir tarefa.' });




        if (result.affectedRows === 0)
            return res.status(404).json({ erro: 'Tarefa não encontrada.' });




        res.json({ sucesso: true, mensagem: 'Tarefa excluída.' });
    });
});




export default router;