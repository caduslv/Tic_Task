const API_URL = "http://localhost:3000";




async function api(endpoint, method = "GET", data = null, auth = false) {
    const options = { method, headers: { "Content-Type": "application/json" } };




    if (auth) {
        const token = localStorage.getItem("token");
        if (token) options.headers["Authorization"] = `Bearer ${token}`;
    }




    if (data) options.body = JSON.stringify(data);




    const res = await fetch(API_URL + endpoint, options);
    return res.json();
}




/* ----------------------- AUTH ----------------------- */




export const Auth = {
    register: (nome, email, senha) => api("/usuarios", "POST", { nome, email, senha }),
    login: (email, senha) => api("/usuarios/login", "POST", { email, senha }),
    getProfile: () => api("/usuarios/me", "GET", null, true),
    updateProfile: (data) => api("/usuarios/me", "PUT", data, true),
    deleteAccount: () => api("/usuarios/me", "DELETE", null, true)
};




/* ----------------------- TASKS ----------------------- */




export const Tasks = {
    list: () => api("/tarefas", "GET", null, true),
    create: (task) => api("/tarefas", "POST", task, true),




    // PATCH correto
    update: (id, task) => api(`/tarefas/${id}`, "PATCH", task, true),




    remove: (id) => api(`/tarefas/${id}`, "DELETE", null, true),




    toggle: (id, newStatus) =>
        api(`/tarefas/${id}`, "PATCH", { status: newStatus }, true)
};




/* --------------------- CATEGORIES --------------------- */




export const Categories = {
    list: () => api("/categorias", "GET", null, true),




    create: (nome) => api("/categorias", "POST", { nome }, true),




    update: (id, nome) => api(`/categorias/${id}`, "PUT", { nome }, true),




    remove: (id) => api(`/categorias/${id}`, "DELETE", null, true)
};


