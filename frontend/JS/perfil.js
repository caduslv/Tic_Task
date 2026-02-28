import { Auth } from "./api.js";




/* ---------------------- ELEMENTOS ---------------------- */




// Dados pessoais
const nameInput = document.getElementById("nome");
const emailInput = document.getElementById("email");




// Alterar senha
const senhaAtualInput = document.getElementById("senha-atual");
const novaSenhaInput = document.getElementById("nova-senha");




// Sidebar
const sidebarName = document.getElementById("profile-name-sidebar");
const sidebarAvatar = document.getElementById("sidebar-avatar");




// Deletar conta
const deleteBtn = document.getElementById("delete-account-btn");




// Mensagem global
const msgBox = document.getElementById("profile-message");




function showMessage(text, type = "success") {
    msgBox.textContent = text;
    msgBox.className = `form-message ${type}`;
    msgBox.style.display = "block";




    setTimeout(() => msgBox.style.display = "none", 3000);
}




/* ---------------------- CARREGAR PERFIL ---------------------- */




async function loadProfile() {
    const res = await Auth.getProfile();




    // Backend retorna: { sucesso: true, usuario: {...} }
    if (!res || !res.sucesso) {
        showMessage("Erro ao carregar perfil", "error");
        return;
    }




    const usuario = res.usuario;




    nameInput.value = usuario.nome;
    emailInput.value = usuario.email;




    // Atualiza sidebar
    if (sidebarName) sidebarName.textContent = usuario.nome;
    if (sidebarAvatar) sidebarAvatar.textContent = usuario.nome.charAt(0).toUpperCase();
}




document.addEventListener("DOMContentLoaded", loadProfile);




/* ---------------------- SALVAR ALTERAÇÕES (NOME/EMAIL) ---------------------- */




document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();




    const data = {
        nome: nameInput.value.trim(),
        email: emailInput.value.trim()
    };




    const res = await Auth.updateProfile(data);




    if (res.erro) {
        showMessage(res.erro, "error");
        return;
    }




    showMessage("Dados atualizados com sucesso!", "success");




    if (sidebarName) sidebarName.textContent = data.nome;
});




/* ---------------------- ALTERAR SENHA ---------------------- */




document.getElementById("password-form").addEventListener("submit", async (e) => {
    e.preventDefault();




    const senhaAtual = senhaAtualInput.value.trim();
    const novaSenha = novaSenhaInput.value.trim();




    if (!senhaAtual || !novaSenha) {
        showMessage("Preencha todos os campos da senha.", "error");
        return;
    }




    const res = await Auth.updateProfile({ senhaAtual, novaSenha });




    if (res.erro) {
        showMessage(res.erro, "error");
        return;
    }




    showMessage("Senha alterada com sucesso!", "success");
    senhaAtualInput.value = "";
    novaSenhaInput.value = "";
});




/* ---------------------- EXCLUIR CONTA ---------------------- */




deleteBtn.addEventListener("click", async () => {
    if (!confirm("⚠ Deseja realmente excluir sua conta? Esta ação é irreversível.")) return;




    const res = await Auth.deleteAccount();




    if (res.erro) {
        showMessage(res.erro, "error");
        return;
    }




    showMessage("Conta removida. Redirecionando...", "success");
    localStorage.clear();




    setTimeout(() => {
        window.location.href = "../HTML/login.html";
    }, 1500);
});


