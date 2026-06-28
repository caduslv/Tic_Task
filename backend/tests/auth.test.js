import request from "supertest";
import app from "../server.js";

describe("🔐 SUÍTE DE TESTES: Autenticação (Auth)", () => {
  const emailDinamico = `cadu.auth.${Date.now()}@teste.com`;
  const senhaValida = "@Cadu2026!"; 

  test("Deve cadastrar um novo usuário com sucesso (Status 201)", async () => {
    const res = await request(app)
      .post("/usuarios")
      .send({
        nome: "Cadu Auth",
        email: emailDinamico,
        senha: senhaValida
      });

    // 🔥 CORRIGIDO: Sua API retorna 201 para novos cadastros!
    expect(res.statusCode).toBe(201);
  });

  test("Deve realizar login com sucesso e retornar o token (Status 200)", async () => {
    const res = await request(app)
      .post("/usuarios/login")
      .send({
        email: emailDinamico,
        senha: senhaValida
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  test("Deve rejeitar login com senha incorreta (Status 401)", async () => {
    const res = await request(app)
      .post("/usuarios/login")
      .send({
        email: emailDinamico,
        senha: "SenhaIncorreta123"
      });

    expect(res.statusCode).toBe(401);
  });
});