import { Auth } from "./api.js";




const registerForm = document.getElementById("register-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const messageBox = document.getElementById("message-box");




function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = type;
    messageBox.style.display = "block";
}




registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();




    const nome = nameInput.value;
    const email = emailInput.value;
    const senha = passwordInput.value;
    const confirm = confirmPasswordInput.value;




    if (senha !== confirm) {
        showMessage("As senhas não coincidem.", "error");
        return;
    }




    const res = await Auth.register(nome, email, senha);




    if (res.error) {
        showMessage(res.error, "error");
        return;
    }




    showMessage("Conta criada com sucesso!", "success");




    setTimeout(() => {
        window.location.href = "login.html";
    }, 1500);
});


