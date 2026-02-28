import { Tasks, Categories, Auth } from "./api.js";




/* ------------------ CARREGAR PERFIL NO DASHBOARD ------------------ */
async function loadUserProfileSidebar() {
    const sidebarName = document.getElementById("profile-name-sidebar");
    const sidebarAvatar = document.getElementById("sidebar-avatar");




    try {
        const user = await Auth.getProfile();




        if (user?.nome) {
            sidebarName.textContent = user.nome;
            sidebarAvatar.textContent = user.nome.trim().charAt(0).toUpperCase();
            return;
        }




        // fallback caso API não retorne nome
        const localName = localStorage.getItem("ticTaskUserName");
        if (localName) {
            sidebarName.textContent = localName;
            sidebarAvatar.textContent = localName.trim().charAt(0).toUpperCase();
            return;
        }




        // se tudo falhar
        sidebarName.textContent = "Usuário";
        sidebarAvatar.textContent = "U";




    } catch (err) {
        console.error("Erro ao carregar perfil:", err);




        // fallback automático em caso de erro
        const localName = localStorage.getItem("ticTaskUserName");
        if (localName) {
            sidebarName.textContent = localName;
            sidebarAvatar.textContent = localName.trim().charAt(0).toUpperCase();
        } else {
            sidebarName.textContent = "Usuário";
            sidebarAvatar.textContent = "U";
        }
    }
}




/* ------------------ UTIL ------------------ */
function formatarData(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}




/* ------------------ ESTADO ------------------ */
let tasks = [];
let currentFilter = "todos";




/* ------------------ ELEMENTOS ------------------ */
const taskListArea = document.getElementById("task-list-area");
const addTaskBtn = document.getElementById("add-task-btn");




const modal = document.getElementById("task-modal");
const taskForm = document.getElementById("task-form");




const modalTitle = document.getElementById("modal-title");
const submitBtn = document.getElementById("modal-submit-btn");




const taskIdInput = document.getElementById("task-id");
const titleInput = document.getElementById("task-title-input");
const descInput = document.getElementById("task-description");
const categoryInput = document.getElementById("task-category-input");
const dateInput = document.getElementById("task-dueDate");




const filtersArea = document.getElementById("category-filters");




/* categorias */
const manageCategoriesBtn = document.getElementById("manage-categories-btn");
const manageModal = document.getElementById("manage-categories-modal");
const categoriesListDiv = document.getElementById("categories-list");
const closeManageBtn = document.getElementById("close-manage-categories");




const editCategoryModal = document.getElementById("edit-category-modal");
const editCategoryForm = document.getElementById("edit-category-form");
const editCategoryId = document.getElementById("edit-category-id");
const editCategoryName = document.getElementById("edit-category-name");
const editCategoryCancel = document.getElementById("edit-category-cancel");




const categoryModal = document.getElementById("category-modal");
const createCategoryBtn = document.getElementById("create-category-btn");
const categoryCancelBtn = document.getElementById("category-cancel-btn");
const categoryForm = document.getElementById("category-form");




/* ------------------ CATEGORIAS ------------------ */
async function loadCategories() {
    const categorias = await Categories.list();
    const lista = Array.isArray(categorias) ? categorias : [];




    categoryInput.innerHTML = `<option value="">Sem categoria</option>`;
    lista.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nome;
        categoryInput.appendChild(opt);
    });




    filtersArea.innerHTML = `<a href="#" class="filter-link active" data-filter="todos">Todos</a>`;
    lista.forEach(c => {
        const link = document.createElement("a");
        link.href = "#";
        link.className = "filter-link";
        link.dataset.filter = c.id;
        link.textContent = c.nome;
        link.onclick = (e) => {
            e.preventDefault();
            currentFilter = c.id;
            document.querySelectorAll(".filter-link").forEach(a => a.classList.remove("active"));
            link.classList.add("active");
            renderTasks();
        };
        filtersArea.appendChild(link);
    });




    const todosLink = filtersArea.querySelector("[data-filter='todos']");
    if (todosLink) {
        todosLink.onclick = (e) => {
            e.preventDefault();
            currentFilter = "todos";
            document.querySelectorAll(".filter-link").forEach(a => a.classList.remove("active"));
            todosLink.classList.add("active");
            renderTasks();
        };
    }




    await loadManageCategories();
}




async function loadManageCategories() {
    const categorias = await Categories.list();
    const lista = Array.isArray(categorias) ? categorias : [];




    categoriesListDiv.innerHTML = "";
    if (lista.length === 0) {
        categoriesListDiv.innerHTML = `<p class="empty">Nenhuma categoria criada.</p>`;
        return;
    }




    lista.forEach(cat => {
        const div = document.createElement("div");
        div.className = "category-item";
        div.innerHTML = `
            <span class="category-name">${cat.nome}</span>
            <div>
                <button class="category-btn edit" data-id="${cat.id}" data-nome="${cat.nome}">Editar</button>
                <button class="category-btn delete" data-id="${cat.id}">Excluir</button>
            </div>
        `;
        div.querySelector(".category-btn.edit").onclick = () => {
            editCategoryId.value = cat.id;
            editCategoryName.value = cat.nome;
            editCategoryModal.classList.add("active");
        };
        div.querySelector(".category-btn.delete").onclick = async () => {
            if (!confirm("Deseja excluir esta categoria?")) return;
            const res = await Categories.remove(cat.id);
            if (res?.erro) return alert(res.erro);
            await loadCategories();
            await loadTasks();
        };
        categoriesListDiv.appendChild(div);
    });
}




/* ------------------ EDITAR CATEGORIA ------------------ */
editCategoryForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = editCategoryId.value;
    const nome = editCategoryName.value.trim();
    if (!nome) return;
    const res = await Categories.update(id, nome);
    if (res?.erro) return alert(res.erro);
    editCategoryModal.classList.remove("active");
    await loadCategories();
    await loadTasks();
};
editCategoryCancel.onclick = () => editCategoryModal.classList.remove("active");




/* ------------------ MODAIS CATEGORIA ------------------ */
manageCategoriesBtn.onclick = () => manageModal.classList.add("active");
closeManageBtn.onclick = () => manageModal.classList.remove("active");
manageModal.onclick = (e) => { if (e.target === manageModal) manageModal.classList.remove("active"); };




createCategoryBtn.onclick = () => {
    document.getElementById("category-name-input").value = "";
    categoryModal.classList.add("active");
};
categoryCancelBtn.onclick = () => categoryModal.classList.remove("active");
categoryModal.onclick = (e) => { if (e.target === categoryModal) categoryModal.classList.remove("active"); };




categoryForm.onsubmit = async (e) => {
    e.preventDefault();
    const nome = document.getElementById("category-name-input").value.trim();
    if (!nome) return;
    const res = await Categories.create(nome);
    if (res?.erro) return alert(res.erro);
    categoryModal.classList.remove("active");
    await loadCategories();
};




/* ------------------ TAREFAS ------------------ */
async function loadTasks() {
    const res = await Tasks.list();
    tasks = Array.isArray(res) ? res : [];
    renderTasks();
}




function renderTasks() {
    const filtered = currentFilter === "todos" ? tasks : tasks.filter(t => t.categoria_id == currentFilter);
    taskListArea.innerHTML = "";
    if (filtered.length === 0) {
        taskListArea.innerHTML = `<p class="empty">Nenhuma tarefa encontrada.</p>`;
        return;
    }
    filtered.forEach(t => renderTaskItem(t));
}




function statusLabel(status) {
    if (!status) return "pendente";
    if (status === "andamento") return "em andamento";
    return status;
}




function renderTaskItem(task) {
    const div = document.createElement("div");
    div.className = "task-item-list";




    const pillClass = `status-pill status-${task.status || "pendente"}`;




    div.innerHTML = `
        <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.status === "concluida" ? "checked" : ""} aria-label="Marcar como concluída">
        <div>
            <p class="task-title">${escapeHtml(task.titulo)}</p>
            ${task.descricao ? `<p class="task-description-list">${escapeHtml(task.descricao)}</p>` : ""}
        </div>
        <span class="task-category">${task.categoria || "Sem categoria"}</span>
        <span class="task-due-date">${formatarData(task.prazo_execucao)}</span>
        <div class="task-actions-list">
            <div class="${pillClass}" data-id="${task.id}">${statusLabel(task.status)}</div>
            <div>
                <button class="task-button task-button-edit" data-id="${task.id}" title="Editar">✎</button>
                <button class="task-button task-button-delete" data-id="${task.id}" title="Excluir">✖</button>
                <button class="task-button task-button-more" data-id="${task.id}" title="Mais">⋯</button>
            </div>
        </div>
    `;




    // checkbox conclude
    const checkbox = div.querySelector(".task-checkbox");
    if (checkbox) {
        checkbox.onchange = async (e) => {
            const novoStatus = e.target.checked ? "concluida" : "pendente";
            await Tasks.update(task.id, { status: novoStatus });
            await loadTasks();
        };
    }




    // editar
    const editBtn = div.querySelector(".task-button-edit");
    if (editBtn) editBtn.onclick = () => openModalEdit(task);




    // excluir
    const delBtn = div.querySelector(".task-button-delete");
    if (delBtn) {
        delBtn.onclick = async () => {
            if (!confirm("Deseja excluir esta tarefa?")) return;
            await Tasks.remove(task.id);
            await loadTasks();
        };
    }




    // botão more -> abre menu status
    const moreBtn = div.querySelector(".task-button-more");
    if (moreBtn) {
        moreBtn.onclick = (e) => {
            e.stopPropagation();
            showStatusMenu(task, moreBtn);
        };
    }




    taskListArea.appendChild(div);
}




/* ------------------ MENU STATUS ------------------ */
function showStatusMenu(task, anchorEl) {
    const old = document.getElementById("status-menu");
    if (old) old.remove();




    const menu = document.createElement("div");
    menu.id = "status-menu";
    menu.className = "status-menu";




    const options = [
        { key: "pendente", label: "Pendente" },
        { key: "andamento", label: "Em andamento" },
        { key: "concluida", label: "Concluída" }
    ];




    options.forEach(op => {
        const btn = document.createElement("button");
        btn.className = "status-menu-btn";
        btn.type = "button";
        btn.textContent = op.label;




        if (op.key === task.status) btn.classList.add("active");




        btn.onclick = async (ev) => {
            ev.stopPropagation();
            if (op.key !== task.status) {
                await Tasks.update(task.id, { status: op.key });
                await loadTasks();
            }
            menu.remove();
        };
        menu.appendChild(btn);
    });




    document.body.appendChild(menu);




    const rect = anchorEl.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX - 10;




    const padding = 8;
    if (left + menuRect.width > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - menuRect.width - padding);
    }
    if (left < padding) left = padding;




    if (top + menuRect.height > window.scrollY + window.innerHeight - padding) {
        top = rect.top + window.scrollY - menuRect.height - 8;
    }




    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;




    const close = (ev) => {
        if (!menu.contains(ev.target) && ev.target !== anchorEl) {
            menu.remove();
            document.removeEventListener("click", close);
            window.removeEventListener("scroll", close);
            window.removeEventListener("resize", close);
        }
    };
    setTimeout(() => document.addEventListener("click", close), 10);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
}




/* ------------------ MODAL TAREFA ------------------ */
function openModalAdd() {
    modalTitle.textContent = "Nova Tarefa";
    submitBtn.textContent = "Salvar";
    taskIdInput.value = "";
    titleInput.value = "";
    descInput.value = "";
    categoryInput.value = "";
    dateInput.value = "";
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
}




function openModalEdit(task) {
    modalTitle.textContent = "Editar Tarefa";
    submitBtn.textContent = "Salvar Alterações";
    taskIdInput.value = task.id;
    titleInput.value = task.titulo || "";
    descInput.value = task.descricao || "";
    categoryInput.value = task.categoria_id || "";
    dateInput.value = task.prazo_execucao?.split("T")[0] || "";
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
}




document.getElementById("modal-cancel-btn").onclick = () => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
};
modal.onclick = (e) => { if (e.target === modal) { modal.classList.remove("active"); modal.setAttribute("aria-hidden", "true"); } };




taskForm.onsubmit = async (e) => {
    e.preventDefault();
    const task = {
        titulo: titleInput.value.trim(),
        descricao: descInput.value.trim(),
        categoria_id: categoryInput.value ? Number(categoryInput.value) : null,
        prazo_execucao: dateInput.value || null
    };




    if (taskIdInput.value) {
        await Tasks.update(taskIdInput.value, task);
    } else {
        await Tasks.create(task);
    }




    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    await loadTasks();
};




/* ------------------ INICIALIZAÇÃO ------------------ */
document.addEventListener("DOMContentLoaded", async () => {
    await loadUserProfileSidebar();
    await loadCategories();
    await loadTasks();
});




addTaskBtn.onclick = openModalAdd;




/* ------------------ HELPERS ------------------ */
function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}


