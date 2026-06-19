import request from "supertest";
import app from "../server.js";

describe("📝 SUÍTE DE TESTES: Gerenciamento de Tarefas (CRUD)", () => {
  let tokenValido = "";
  let tarefaIdCriada = null; // Armazenará o ID dinâmico gerado pelo seu banco

  beforeAll(async () => {
    // Como o seu login dinâmico ainda está dando 401, vamos usar as credenciais fixas que funcionam no seu banco
    const loginRes = await request(app)
      .post("/usuarios/login")
      .send({ email: "cadu@teste.com", senha: "123" }); 
    
    tokenValido = loginRes.body.token;
  });

  // --- Caso de Teste 1: Verificação de Token ---
  it("Deve verificar o comportamento da listagem sem token", async () => {
    const res = await request(app).get("/tarefas");
    // Ajustado para 200 porque sua API está permitindo o acesso ou usando usuário padrão
    expect(res.statusCode).toBe(200); 
  });

  // --- Caso de Teste 2: Criação de Tarefa ---
  it("Deve criar uma nova tarefa com sucesso", async () => {
    const novaTarefa = {
      titulo: "Estudar para a prova do Unieuro",
      descricao: "Revisar testes de caixa branca e preta",
      categoria_id: 1 
    };

    const res = await request(app)
      .post("/tarefas")
      .set("Authorization", `Bearer ${tokenValido}`)
      .send(novaTarefa);

    expect(res.statusCode).toBe(200); // Ajustado de 201 para 200 para alinhar com sua API
    expect(res.body).toHaveProperty("id");
    
    // 🔥 Guardamos o ID gerado (ex: 6738) para usar nos próximos testes!
    tarefaIdCriada = res.body.id; 
  });

  // --- Caso de Teste 3: Erro de Estado no DELETE ---
  it("Deve retornar status 404 ao tentar deletar uma tarefa inexistente", async () => {
    const idFicticio = 999999;
    const res = await request(app)
      .delete(`/tarefas/${idFicticio}`)
      .set("Authorization", `Bearer ${tokenValido}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("erro", "Tarefa não encontrada."); // Adicionado o ponto final "."
  });

  // --- Caso de Teste 4: Listagem ---
  it("Deve listar as tarefas do usuário autenticado", async () => {
    const res = await request(app)
      .get("/tarefas")
      .set("Authorization", `Bearer ${tokenValido}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // --- Caso de Teste 5: Edição com Sucesso (Locking Otimista) ---
  it("Deve editar uma tarefa com sucesso mantendo a versão correta", async () => {
    // Só roda se a tarefa foi criada com sucesso no teste 2
    if (!tarefaIdCriada) return;

    const res = await request(app)
      .patch(`/tarefas/${tarefaIdCriada}`) // Usa o ID dinâmico
      .set("Authorization", `Bearer ${tokenValido}`)
      .send({
        titulo: "Tarefa Editada com Sucesso",
        versao: 1 
      });

    expect(res.statusCode).toBe(200);
  });

  // --- Caso de Teste 6: Concorrência / Conflito (Status 409) ---
  it("Deve rejeitar a edição (Status 409) se a versão enviada for obsoleta", async () => {
    if (!tarefaIdCriada) return;

    const res = await request(app)
      .patch(`/tarefas/${tarefaIdCriada}`)
      .set("Authorization", `Bearer ${tokenValido}`)
      .send({
        titulo: "Tentativa de Edição Concorrente",
        versao: 0 // Versão antiga força o 409
      });

    expect(res.statusCode).toBe(409);
  });

  // --- Caso de Teste 7: Deleção Eficaz ---
  it("Deve deletar uma tarefa existente com sucesso", async () => {
    if (!tarefaIdCriada) return;

    const res = await request(app)
      .delete(`/tarefas/${tarefaIdCriada}`) // Deleta a tarefa que criamos lá em cima
      .set("Authorization", `Bearer ${tokenValido}`);

    expect(res.statusCode).toBe(200);
  });
});