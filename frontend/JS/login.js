import { Auth } from "./api.js";




const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageBox = document.getElementById("message-box");




function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = type;
    messageBox.style.display = "block";
}




form.addEventListener("submit", async (e) => {
    e.preventDefault();




    const email = emailInput.value;
    const senha = passwordInput.value;




    // Faz a requisição
    const res = await Auth.login(email, senha);




    console.log("Resposta do servidor:", res);




    // Se o backend retornar erro, exibe mensagem no front
    if (res.error || res.erro || res.message === "Usuário não encontrado" || res.message === "Senha inválida") {
        showMessage(res.error || res.erro || res.message, "error");
        return;
    }




    // Salva token
    if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("userId", res.usuario.id);
        localStorage.setItem("userName", res.usuario.nome);
        localStorage.setItem("userEmail", res.usuario.email);




    }




    // Identifica o nome independente do padrão do backend
    const usuario = res.user || res.usuario || res.data || res.dados;




    if (usuario?.nome) {
        localStorage.setItem("ticTaskUserName", usuario.nome);
    }




    // Redireciona para dashboard
    window.location.href = "../HTML/dashboard.html";
});


