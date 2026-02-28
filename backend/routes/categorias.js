import express from "express";
import connection from "../config/db.js";
import auth from "../middleware/auth.js";




const router = express.Router();








// Criar categoria (somente se o usuário estiver logado)




router.post("/", auth, (req, res) => {
  const { nome } = req.body;




  if (!nome) {
    return res.status(400).json({ erro: "O nome da categoria é obrigatório." });
  }




  const sqlCheck = `
      SELECT id FROM Categorias
      WHERE nome = ? AND usuario_id = ?
  `;




  connection.query(sqlCheck, [nome, req.user.id], (err, results) => {
    if (err) return res.status(500).json({ erro: "Erro ao verificar categoria." });




    if (results.length > 0) {
      return res.status(400).json({ erro: "Você já possui uma categoria com esse nome." });
    }




    const sqlInsert = `
        INSERT INTO Categorias (nome, usuario_id)
        VALUES (?, ?)
    `;




    connection.query(sqlInsert, [nome, req.user.id], (err, result) => {
      if (err) {
        return res.status(500).json({ erro: "Erro ao criar categoria." });
      }




      res.status(201).json({
        sucesso: true,
        mensagem: "Categoria criada com sucesso!",
        categoria: {
          id: result.insertId,
          nome,
          usuario_id: req.user.id,
        },
      });
    });
  });
});








// Listar categorias do usuário (somente se o usuário estiver logado)




router.get("/", auth, (req, res) => {
  const sql = `
      SELECT id, nome
      FROM Categorias
      WHERE usuario_id = ?
      ORDER BY nome ASC
  `;




  connection.query(sql, [req.user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: "Erro ao listar categorias." });
    }




    res.json(results);
  });
});








// atualizar categoria (somente se o usuário estiver logado)




router.put("/:id", auth, (req, res) => {
  const { nome } = req.body;
  const { id } = req.params;




  if (!nome) {
    return res.status(400).json({ erro: "O nome da categoria é obrigatório." });
  }




  const sqlCheck = `
      SELECT id FROM Categorias
      WHERE nome = ? AND usuario_id = ? AND id <> ?
  `;




  connection.query(sqlCheck, [nome, req.user.id, id], (err, results) => {
    if (err) return res.status(500).json({ erro: "Erro ao verificar categoria." });




    if (results.length > 0) {
      return res.status(400).json({ erro: "Você já possui outra categoria com esse nome." });
    }




    const sql = `
      UPDATE Categorias
      SET nome = ?
      WHERE id = ? AND usuario_id = ?
    `;




    connection.query(sql, [nome, id, req.user.id], (err, result) => {
      if (err) return res.status(500).json({ erro: "Erro ao atualizar categoria." });




      if (result.affectedRows === 0) {
        return res.status(404).json({ erro: "Categoria não encontrada." });
      }




      res.json({
        sucesso: true,
        mensagem: "Categoria atualizada com sucesso!",
        categoria: { id, nome },
      });
    });
  });
});








// excluir categoria (somente se o usuário estiver logado)




router.delete("/:id", auth, (req, res) => {
  const { id } = req.params;




  // Primeiro: verificar se existe tarefa usando essa categoria
  const sqlCheckTasks = `
      SELECT COUNT(*) AS total
      FROM Tarefas
      WHERE categoria_id = ? AND usuario_id = ?
  `;




  connection.query(sqlCheckTasks, [id, req.user.id], (err, results) => {
    if (err) return res.status(500).json({ erro: "Erro ao verificar vínculo com tarefas." });




    if (results[0].total > 0) {
      return res.status(400).json({
        erro: "Não é possível excluir uma categoria que está sendo usada por tarefas."
      });
    }




    // Agora pode excluir
    const sqlDelete = `
        DELETE FROM Categorias
        WHERE id = ? AND usuario_id = ?
    `;




    connection.query(sqlDelete, [id, req.user.id], (err, result) => {
      if (err) return res.status(500).json({ erro: "Erro ao excluir categoria." });




      if (result.affectedRows === 0) {
        return res.status(404).json({ erro: "Categoria não encontrada." });
      }




      res.json({
        sucesso: true,
        mensagem: "Categoria excluída com sucesso!",
        id,
      });
    });
  });
});








export default router;