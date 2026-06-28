import request from "supertest";
import app from "../server.js";

describe("🚀 SUÍTE DE TESTES: API Completa", () => {
  let tokenValido;
  let tarefaIdCriada;
  const emailDinamico = `cadu.teste.${Date.now()}@teste.com`;
  const senhaPadrao = "@Cadu2026!"; 

  beforeAll(async () => {
    // 1. Cadastra o usuário dinamicamente
    await request(app).post("/usuarios").send({
      nome: "Tester",
      email: emailDinamico,
      senha: senhaPadrao,
    });

    // 2. Faz o login imediatamente para pegar o token
    const res = await request(app).post("/usuarios/login").send({
      email: emailDinamico,
      senha: senhaPadrao,
    });
    
    tokenValido = res.body.token;
  });

  test("Deve listar as tarefas do usuário autenticado (Status 200)", async () => {
    const res = await request(app)
      .get("/tarefas")
      .set("Authorization", `Bearer ${tokenValido}`);
    
    expect(res.statusCode).toBe(200);
  });

  test("Deve criar uma nova tarefa com sucesso (Status 200)", async () => {
    const res = await request(app)
      .post("/tarefas")
      .set("Authorization", `Bearer ${tokenValido}`)
      .send({
        titulo: "Tarefa de Teste Automatizada",
        descricao: "Criada via Jest para a demo",
        status: "pendente"
      });

    expect(res.statusCode).toBe(200); 
    expect(res.body).toHaveProperty("id");
    
    tarefaIdCriada = res.body.id;
  });

  test("Deve editar os dados da tarefa com sucesso (Status 200)", async () => {
    if (!tarefaIdCriada) return;

    const res = await request(app)
      .patch(`/tarefas/${tarefaIdCriada}`)
      .set("Authorization", `Bearer ${tokenValido}`)
      .send({
        titulo: "Tarefa Atualizada via Teste",
        descricao: "Descrição alterada com sucesso!",
        status: "concluida", 
        versao: 1            // 🔥 ATUALIZADO: Ajustado para 1 para casar com a versão inicial do banco
      });

    expect(res.statusCode).toBe(200);
  });

  test("Deve deletar a tarefa com sucesso (Status 200)", async () => {
    if (!tarefaIdCriada) return;
    
    const res = await request(app)
      .delete(`/tarefas/${tarefaIdCriada}`)
      .set("Authorization", `Bearer ${tokenValido}`);
    
    expect(res.statusCode).toBe(200);
  });
});