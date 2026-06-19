// routes/tarefas.js
import express from 'express';
import connection from '../config/db.js';
import auth from '../middleware/auth.js';
import redis from '../config/redisClient.js';

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

// ==========================================
// 1. CRIAR TAREFA (POST) - Sem alterações
// ==========================================
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
        ], async (err, result)=> { 
            if (err) return res.status(500).json({erro: 'Erro ao criar tarefa.'});

            try {
                const taskId = result.insertId;
                const chavesFiltros = await redis.keys(`tarefas:usuario:${usuarioId}:filtros:*`);
                if (chavesFiltros.length > 0){
                    await redis.del(chavesFiltros);
                    console.log(`[API] 🧼 Cache limpo para o usuário ${usuarioId} após a criação da tarefa.`);
                }
                
                const playLoad = {
                    taskId: taskId,
                    eventType: 'SYNC_EXTERNAL_CALENDAR',
                    data: {titulo, descricao }
                };

                await redis.lpush('fila:tarefas', JSON.stringify(playLoad));
                console.log(`[API] Sucesso! Tarefa ${taskId} enviada para a fila do Redis para processamento assíncrono.`);

                res.status(200).json({
                    sucesso:true,
                    id: taskId,
                    mensagem: 'Tarefa criada com sucesso'
                });
            } catch (redisErr) {
                console.error('[ERRO] Falha ao enviar tarefa para a fila do Redis: ', redisErr);
                res.status(201).json({
                    sucesso: true,
                    id: result.insertId,
                });
            }
        });
    });
});

// ==========================================
// 2. LISTAR TAREFAS (GET) - Alterado
// ==========================================
router.get('/', auth, async (req, res) => {
    const usuarioId = req.user.id;
    const { status, prioridade, categoria_id, q, ordenar, page = 1, limit = 50 } = req.query;

    const filtrosObj = { status, prioridade, categoria_id, q, ordenar, page, limit };

    const filtrosString = Object.keys(filtrosObj)
        .filter(key => filtrosObj[key] !== undefined && filtrosObj[key] !== '')
        .sort()
        .map(key => `${key}_${filtrosObj[key]}`)
        .join(':');

    const cachekey = `tarefas:usuario:${usuarioId}:filtros:${filtrosString}`;

    try {
        const cacheData = await redis.get(cachekey);
        if (cacheData) {
            console.log(`[API] Cache hit! Retornando filtros direto do Redis para o usuário ${usuarioId}`);
            return res.json(JSON.parse(cacheData));
        }
    }catch (redisErr){
        console.error('[REDIS ERRO] Falha ao acessar cache do Redis:', redisErr);
    }
    const where = ['t.usuario_id = ?'];
    const valores = [usuarioId];

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

    if (prioridade) {
        if (!PRIORIDADES.includes(prioridade))
            return res.status(400).json({ erro: 'Prioridade inválida.' });

        where.push('t.prioridade = ?');
        valores.push(prioridade);
    }

    if (categoria_id) {
        where.push('t.categoria_id = ?');
        valores.push(categoria_id);
    }

    if (q) {
        where.push('t.titulo LIKE ?');
        valores.push(`%${q}%`);
    }

    let orderBy = 'ORDER BY t.data_criacao DESC';
    if (ordenar === 'prazo') orderBy = 'ORDER BY (t.prazo_execucao IS NULL), t.prazo_execucao ASC';
    if (ordenar === 'prioridade') orderBy = "ORDER BY FIELD(t.prioridade, 'alta', 'media', 'baixa')";
    if (ordenar === 'concluidas') orderBy = 'ORDER BY t.data_conclusao DESC';

    const offset = (Number(page) - 1) * Number(limit);

    // MUDANÇA AQUI: Incluímos t.versao no SELECT para o Frontend receber esse dado
    const sql = `
        SELECT
            t.id, t.titulo, t.descricao, t.prazo_execucao, t.status,
            t.prioridade, t.versao, t.data_criacao, t.data_conclusao,
            t.categoria_id, c.nome AS categoria
        FROM Tarefas t
        LEFT JOIN Categorias c ON t.categoria_id = c.id
        WHERE ${where.join(' AND ')}
        ${orderBy}
        LIMIT ? OFFSET ?
    `;

    valores.push(Number(limit), Number(offset));

    connection.query(sql, valores,async(err, results) => {
        if (err) {
            console.error('Erro listar tarefas:', err);
            return res.status(500).json({ erro: 'Erro ao listar tarefas.' });
        }
        try {
            await redis.setex(cachekey, 3600, JSON.stringify(results));
            console.log(`[API] 💾 Novo cache gravado para a chave ${cachekey} com os filtros: ${filtrosString}`);
        }catch (redisErr){
            console.error('[REDIS ERRO] Falha ao salvar dados no cache do Redis:', redisErr);
        }
        res.json(results);
    });
});

// ==========================================
// 3. GET POR ID - Sem alterações
// ==========================================
router.get('/:id', auth, (req, res) => {
    // Como é SELECT *, a versão já vem automaticamente aqui
    const sql = `SELECT * FROM Tarefas WHERE id = ? AND usuario_id = ?`;

    connection.query(sql, [req.params.id, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar tarefa.' });
        if (results.length === 0) return res.status(404).json({ erro: 'Tarefa não encontrada.' });

        res.json(results[0]);
    });
});

// ==========================================
// 4. ATUALIZAR TAREFA (PATCH) - Alterado
// ==========================================
router.patch('/:id', auth, async (req, res) => {
    // MUDANÇA AQUI: Recebendo a 'versao' do req.body
    const { titulo, descricao, prazo_execucao, prioridade, status, categoria_id, versao } = req.body;
    const usuarioId = req.user.id;

    // MUDANÇA AQUI: Validação para garantir que o front enviou a versão
    if (versao === undefined) {
        return res.status(400).json({ erro: 'A versão da tarefa é obrigatória para atualizar (Locking Otimista).' });
    }

    const campos = [];
    const valores = [];

    if (titulo) { campos.push('titulo = ?'); valores.push(titulo); }
    if (descricao) { campos.push('descricao = ?'); valores.push(descricao); }

    if (prazo_execucao) {
        const prazo = new Date(prazo_execucao);
        if (isNaN(prazo)) return res.status(400).json({ erro: 'Prazo inválido.' });
        campos.push('prazo_execucao = ?');
        valores.push(prazo_execucao);
    }

    if (prioridade) {
        if (!PRIORIDADES.includes(prioridade))
            return res.status(400).json({ erro: 'Prioridade inválida.' });
        campos.push('prioridade = ?');
        valores.push(prioridade);
    }

    if (status) {
        if (!STATUS_VALIDOS.includes(status))
            return res.status(400).json({ erro: 'Status inválido.' });
        campos.push('status = ?');
        valores.push(status);

        if (status === 'concluida') {
            campos.push('data_conclusao = NOW()');
        } else {
            campos.push('data_conclusao = NULL');
        }
    }

    if (campos.length === 0 && categoria_id === undefined)
        return res.status(400).json({ erro: 'Nada para atualizar.' });

    // MUDANÇA AQUI: Incrementa a versão no banco
    campos.push('versao = versao + 1');

    const aplicarUpdate = (categoriaPermitida = true) => {
        if (!categoriaPermitida)
            return res.status(403).json({ erro: 'Categoria não permitida.' });

        // MUDANÇA AQUI: Adicionado o 'AND versao = ?' no WHERE
        const sql = `
            UPDATE Tarefas SET
            ${campos.join(', ')}
            ${categoria_id !== undefined ? ', categoria_id = ?' : ''}
            WHERE id = ? AND usuario_id = ? AND versao = ?
        `;

        if (categoria_id !== undefined) valores.push(categoria_id);

        // MUDANÇA AQUI: Injetando os valores do WHERE na ordem certa (id, usuarioId, versao)
        valores.push(req.params.id, usuarioId, versao);

        connection.query(sql, valores, async (err, result) => {
            if (err) return res.status(500).json({ erro: 'Erro ao atualizar tarefa.' });
            
            // MUDANÇA AQUI: A regra principal do Locking Otimista
            if (result.affectedRows === 0) {
                return res.status(409).json({ 
                    erro: 'Conflito de concorrência: A tarefa não foi encontrada ou foi modificada por outro processo. Por favor, recarregue a tela.' 
                });
            }

            const payload = {
                taskId: req.params.id,
                eventType: 'TASK_UPDATED',
                status: status || null,
                userId: usuarioId
            };
            try {
                await redis.lpush('fila:tarefas', JSON.stringify(payload));
                console.log(`[API] Evento TASK_UPDATED enviado para a fila do Redis da tarefa ${req.params.id}`);
            }catch (redisErr){
                console.error('Erro ao enviar tarefa atualizada para a fila do Redis:', redisErr);
            }
            res.json({ sucesso: true, message: 'Tarefa atualizada com sucesso.' });
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

// ==========================================
// 5. EXCLUIR TAREFA (DELETE) - Sem alterações
// ==========================================
router.delete('/:id', auth, (req, res) => {
    const sql = `DELETE FROM Tarefas WHERE id = ? AND usuario_id = ?`;

    connection.query(sql, [req.params.id, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ erro: 'Erro ao excluir tarefa.' });

        if (result.affectedRows === 0)
            return res.status(404).json({ erro: 'Tarefa não encontrada.' });

        const payload = JSON.stringify({
            taskId: req.params.id,
            eventType: 'TASK_DELETED',
            userId: req.user.id,
        });

        redis.rpush('fila:tarefas', payload)
            .then(() => {
                console.log(`[API] Tarefa ${req.params.id} excluída no MySQL e evento enviado para a fila.`);
                res.json({ sucesso: true, mensagem: 'Tarefa excluída com sucesso.' });
            })
            .catch((redisErr) => {
                console.error('[REDIS ERRO] Falha ao enfileirar TASK_DELETED:', redisErr);
                res.json({ sucesso: true, mensagem: 'Tarefa excluída (falha no background).' });
            });
    });
});

export default router;