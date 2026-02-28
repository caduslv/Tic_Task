import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connection from "./config/db.js";


// Carrega variáveis do .env
dotenv.config();


// Inicializa o app web
const app = express();


// Middlewares
app.use(cors());
app.use(express.json());


// Rotas
import usuariosRoutes from "./routes/usuarios.js";
import tarefasRoutes from "./routes/tarefas.js";
import categoriasRoutes from "./routes/categorias.js";
import adminRoutes from "./routes/admin.js";


// Usar rotas
app.use("/usuarios", usuariosRoutes);
app.use("/tarefas", tarefasRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/admin", adminRoutes);


// Teste de banco
app.get("/teste", (req, res) => {
  connection.query("SELECT 1 + 1 AS resultado", (err, results) => {
    if (err) return res.status(500).json({ error: "Erro na conexão ao banco" });
    res.json({ sucesso: true, resultado: results[0].resultado });
  });
});


// Rota inicial
app.get("/", (req, res) => {
  res.json({ mensagem: "API TicTask funcionando! 🚀" });
});


// Rota 404
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});


// Porta
const PORT = process.env.PORT || 3000;


// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
