import request from "supertest";
import app from "../server.js";

describe("🔐 SUÍTE DE TESTES: Autenticação e Usuários", () => {
  // Gerar um e-mail dinâmico para evitar erros de duplicidade no MySQL
  const emailDinamico = `cadu.teste.${Date.now()}@teste.com`;
  const senhaPadrao = "@Cadu2026!"; // 🔥 Atende a todos os requisitos de segurança!

  // --- 1. TESTES DE CADASTRO (SIGNUP) ---
  describe("POST /usuarios", () => {
    
    it("Deve cadastrar um novo usuário com sucesso", async () => {
      const novoUsuario = {
        nome: "Carlos Eduardo",
        email: emailDinamico,
        senha: senhaPadrao
      };

      const res = await request(app)
        .post("/usuarios") 
        .send(novoUsuario);

      // 🔥 CORRIGIDO: Alinhado com o status 201 (Created) que o seu MySQL retornou
      expect(res.statusCode).toBe(201); 
      expect(res.body).toHaveProperty("mensagem"); 
    });

    it("Deve rejeitar o cadastro se houver campos obrigatórios ausentes", async () => {
      const usuarioInvalido = {
        nome: "Cadu Sem Email",
        senha: senhaPadrao
      };

      const res = await request(app)
        .post("/usuarios")
        .send(usuarioInvalido);

      expect(res.statusCode).toBe(400); 
      expect(res.body).toHaveProperty("erro");
    });
  });

  // --- 2. TESTES DE LOGIN (SIGNIN) ---
  describe("POST /usuarios/login", () => {

    it("Deve autenticar o usuário criado anteriormente e retornar o Token JWT", async () => {
      const credenciais = {
        email: emailDinamico, 
        senha: senhaPadrao
      };

      const res = await request(app)
        .post("/usuarios/login")
        .send(credenciais);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token"); 
    });

    it("Deve rejeitar o acesso se a senha estiver incorreta", async () => {
      const loginSenhaErrada = {
        email: emailDinamico,
        senha: "@SenhaErrada123!"
      };

      const res = await request(app)
        .post("/usuarios/login")
        .send(loginSenhaErrada);

      expect(res.statusCode).toBe(401); 
      expect(res.body).toHaveProperty("erro");
    });

    it("Deve retornar erro ao tentar logar com um e-mail que não existe", async () => {
      const loginUsuarioInexistente = {
        email: "fantasma_que_nao_existe@gmail.com",
        senha: senhaPadrao
      };

      const res = await request(app)
        .post("/usuarios/login")
        .send(loginUsuarioInexistente);

      expect(res.statusCode).toBe(401); 
      expect(res.body).toHaveProperty("erro");
    });
  });
});