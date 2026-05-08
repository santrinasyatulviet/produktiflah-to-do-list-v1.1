// ========== DATA ==========
let tasks = [];
let categories = ["Umum", "Pribadi", "Pekerjaan", "Belanja"];
let editId = null;
let currentPage = "tasks";

function saveToLocal() {
    localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
    localStorage.setItem("taskflow_categories", JSON.stringify(categories));
}

function loadFromLocal() {
    const storedTasks = localStorage.getItem("taskflow_tasks");
    const storedCats = localStorage.getItem("taskflow_categories");
    if (storedTasks) tasks = JSON.parse(storedTasks);
    if (storedCats) categories = JSON.parse(storedCats);
    if (!storedTasks) tasks = [];
    if (!storedCats) categories = ["Umum", "Pribadi", "Pekerjaan", "Belanja"];
}

function showCenterPopup(message, icon = "✅") {
    let old = document.querySelector(".center-toast");
    if (old) old.remove();
    let div = document.createElement("div");
    div.className = "center-toast";
    div.innerHTML = `<i class="fas ${icon === '✅' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1800);
}

function updateCategoryDropdowns() {
    const filterCatActive = document.getElementById("filterCategoryActive");
    const filterCatCompleted = document.getElementById("filterCategoryCompleted");
    const modalCat = document.getElementById("taskCategory");
    const render = (selectEl, includeAll = true) => {
        let oldVal = selectEl.value;
        selectEl.innerHTML = includeAll ? '<option value="all">Semua Kategori</option>' : '';
        categories.forEach(cat => {
            let opt = document.createElement("option");
            opt.value = cat;
            opt.innerText = cat;
            selectEl.appendChild(opt);
        });
        if (includeAll && oldVal && oldVal !== "all" && categories.includes(oldVal)) selectEl.value = oldVal;
        else if (!includeAll && categories.includes(oldVal)) selectEl.value = oldVal;
        else if (includeAll && oldVal === "all") selectEl.value = "all";
        else selectEl.value = categories[0] || "Umum";
    };
    if (filterCatActive) render(filterCatActive, true);
    if (filterCatCompleted) render(filterCatCompleted, true);
    if (modalCat) render(modalCat, false);
}

function sortTasksByNewest(arr) {
    return [...arr].sort((a, b) => b.createdAt - a.createdAt);
}

function renderActiveTasks() {
    let search = document.getElementById("searchActive").value.toLowerCase();
    let priority = document.getElementById("filterPriorityActive").value;
    let category = document.getElementById("filterCategoryActive").value;
    let filtered = tasks.filter(t => !t.completed);
    if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
    if (priority !== "all") filtered = filtered.filter(t => t.priority === priority);
    if (category !== "all") filtered = filtered.filter(t => t.category === category);
    filtered = sortTasksByNewest(filtered);
    const container = document.getElementById("activeTasksContainer");
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state" style="text-align:center; padding:2rem;">Tidak ada tugas aktif silahkan Tambah tugas, atau beristirahalah</div>`;
        return;
    }
    container.innerHTML = filtered.map(task => taskCardHtml(task)).join("");
    attachEvents();
}

function renderCompletedTasks() {
    let search = document.getElementById("searchCompleted").value.toLowerCase();
    let priority = document.getElementById("filterPriorityCompleted").value;
    let category = document.getElementById("filterCategoryCompleted").value;
    let filtered = tasks.filter(t => t.completed);
    if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
    if (priority !== "all") filtered = filtered.filter(t => t.priority === priority);
    if (category !== "all") filtered = filtered.filter(t => t.category === category);
    filtered = sortTasksByNewest(filtered);
    const container = document.getElementById("completedTasksContainer");
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state" style="text-align:center; padding:2rem;"> Belum ada tugas selesai </div>`;
        return;
    }
    container.innerHTML = filtered.map(task => taskCardHtml(task)).join("");
    attachEvents();
}

function formatDate(timestamp) {
    if (!timestamp) return "-";
    let d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function taskCardHtml(task) {
    const priorityClass = task.priority === 'high' ? 'priority-high' : (task.priority === 'medium' ? 'priority-medium' : 'priority-low');
    const priorityText = task.priority === 'high' ? 'Tinggi' : (task.priority === 'medium' ? 'Sedang' : 'Rendah');
    return `
        <div class="task-card" data-id="${task.id}">
            <div class="task-title">
                <span>${escapeHtml(task.title)}</span>
                <span class="badge ${priorityClass}">${priorityText}</span>
            </div>
            <div class="task-details">
                <div><i class="far fa-calendar-alt"></i> Deadline: ${task.dueDate || '-'}</div>
                <div><i class="fas fa-hourglass-half"></i> Estimasi: ${task.estimateTime ? task.estimateTime + ' menit' : '-'}</div>
                <div><i class="far fa-clock"></i> Dibuat: ${formatDate(task.createdAt)}</div>
                <div><i class="far fa-folder"></i> Kategori: ${escapeHtml(task.category)}</div>
            </div>
            <div class="task-actions">
                <button class="complete-task" title="${task.completed ? 'Batal selesai' : 'Selesai'}"><i class="fas ${task.completed ? 'fa-undo-alt' : 'fa-check-circle'}"></i></button>
                <button class="edit-task" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="delete-task" title="Hapus"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function attachEvents() {
    document.querySelectorAll(".complete-task").forEach(btn => {
        btn.onclick = (e) => {
            const card = btn.closest(".task-card");
            const id = parseInt(card.dataset.id);
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveToLocal();
                refreshPage();
                showCenterPopup(task.completed ? "✨ Tugas selesai! ✨" : "↩️ Dikembalikan ke aktif", task.completed ? "✅" : "🔄");
            }
        };
    });
    document.querySelectorAll(".edit-task").forEach(btn => {
        btn.onclick = (e) => {
            const id = parseInt(btn.closest(".task-card").dataset.id);
            const task = tasks.find(t => t.id === id);
            if (task) openEditModal(task);
        };
    });
    document.querySelectorAll(".delete-task").forEach(btn => {
        btn.onclick = (e) => {
            if (confirm("Hapus tugas ini?")) {
                const id = parseInt(btn.closest(".task-card").dataset.id);
                tasks = tasks.filter(t => t.id !== id);
                saveToLocal();
                refreshPage();
                showCenterPopup("🗑 Tugas dihapus", "🗑");
            }
        };
    });
}

function refreshPage() {
    if (currentPage === "tasks") renderActiveTasks();
    else if (currentPage === "completed") renderCompletedTasks();
    else if (currentPage === "stats") renderStats();
    updateCategoryDropdowns();
}

function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById("totalTasksStat").innerText = total;
    document.getElementById("completedTasksStat").innerText = completed;
    document.getElementById("completionPercent").innerHTML = `${percent}% selesai`;
    document.getElementById("progressFill").style.width = `${percent}%`;
    let catMap = new Map();
    tasks.forEach(t => {
        if (!catMap.has(t.category)) catMap.set(t.category, { total: 0, done: 0 });
        let d = catMap.get(t.category);
        d.total++;
        if (t.completed) d.done++;
    });
    let summaryHtml = "";
    for (let [cat, d] of catMap.entries()) {
        let pct = d.total === 0 ? 0 : Math.round((d.done / d.total) * 100);
        summaryHtml += `<div><b>${escapeHtml(cat)}</b> ${d.done}/${d.total} (${pct}%)<div class="progress-bar-bg"><div class="progress-fill" style="width:${pct}%; background:#3b82f6;"></div></div></div>`;
    }
    document.getElementById("categorySummary").innerHTML = summaryHtml || "Belum ada kategori";
    let catsHtml = "";
    categories.forEach(cat => {
        catsHtml += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--card-border);">
                        <span>🏷️ ${escapeHtml(cat)}</span>
                        <button class="deleteCatBtn" data-cat="${escapeHtml(cat)}" style="background:none; border:none; color:#b91c1c; cursor:pointer;"><i class="fas fa-trash"></i></button>
                     </div>`;
    });
    document.getElementById("categoriesList").innerHTML = catsHtml;
    document.querySelectorAll(".deleteCatBtn").forEach(btn => {
        btn.onclick = () => {
            let catName = btn.getAttribute("data-cat");
            if (tasks.some(t => t.category === catName)) {
                showCenterPopup(`❌ Kategori "${catName}" masih dipakai`, "❌");
                return;
            }
            if (confirm(`Hapus kategori "${catName}"?`)) {
                categories = categories.filter(c => c !== catName);
                saveToLocal();
                refreshPage();
                renderStats();
                showCenterPopup(`Kategori "${catName}" dihapus`, "🗑");
            }
        };
    });
}

function openAddModal() {
    editId = null;
    document.getElementById("modalTitle").innerText = "Tambah Tugas Baru";
    document.getElementById("taskTitleInput").value = "";
    document.getElementById("taskDueDate").value = "";
    document.getElementById("taskEstimate").value = "";
    document.getElementById("taskPriority").value = "medium";
    updateCategoryDropdowns();
    document.getElementById("taskCategory").value = categories[0];
    document.getElementById("taskModal").style.display = "flex";
}

function openEditModal(task) {
    editId = task.id;
    document.getElementById("modalTitle").innerText = "Edit Tugas";
    document.getElementById("taskTitleInput").value = task.title;
    document.getElementById("taskDueDate").value = task.dueDate || "";
    document.getElementById("taskEstimate").value = task.estimateTime || "";
    document.getElementById("taskPriority").value = task.priority;
    updateCategoryDropdowns();
    document.getElementById("taskCategory").value = task.category;
    document.getElementById("taskModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("taskModal").style.display = "none";
    editId = null;
}

function saveTask() {
    let title = document.getElementById("taskTitleInput").value.trim();
    if (!title) {
        showCenterPopup("Nama tugas harus diisi", "⚠️");
        return;
    }
    let dueDate = document.getElementById("taskDueDate").value;
    let estimateTime = parseInt(document.getElementById("taskEstimate").value);
    if (isNaN(estimateTime)) estimateTime = null;
    let priority = document.getElementById("taskPriority").value;
    let category = document.getElementById("taskCategory").value;
    if (editId) {
        let idx = tasks.findIndex(t => t.id === editId);
        if (idx !== -1) {
            tasks[idx] = { ...tasks[idx], title, dueDate, estimateTime, priority, category };
            saveToLocal();
            refreshPage();
            showCenterPopup("✏️ Tugas diperbarui", "✏️");
        }
    } else {
        let newTask = {
            id: Date.now(),
            title,
            dueDate,
            estimateTime,
            priority,
            category,
            completed: false,
            createdAt: Date.now()
        };
        tasks.push(newTask);
        saveToLocal();
        refreshPage();
        showCenterPopup("➕ Tugas baru ditambahkan", "➕");
    }
    closeModal();
}

// ========== THEME MANAGEMENT ==========
function initTheme() {
    const savedTheme = localStorage.getItem("produktiflah_theme") || "light";
    document.body.classList.add(savedTheme);
    updateActiveThemeButton(savedTheme);
}

function setTheme(theme) {
    document.body.classList.remove("light", "dark", "glass");
    document.body.classList.add(theme);
    localStorage.setItem("produktiflah_theme", theme);
    updateActiveThemeButton(theme);
}

function updateActiveThemeButton(theme) {
    document.querySelectorAll(".theme-btn").forEach(btn => {
        if (btn.getAttribute("data-theme") === theme) {
            btn.style.opacity = "1";
            btn.style.fontWeight = "bold";
            btn.style.transform = "scale(1.05)";
        } else {
            btn.style.opacity = "0.7";
            btn.style.fontWeight = "normal";
            btn.style.transform = "scale(1)";
        }
    });
}

// ========== EVENT LISTENERS ==========
document.addEventListener("DOMContentLoaded", () => {
    loadFromLocal();
    updateCategoryDropdowns();
    renderActiveTasks();
    renderCompletedTasks();
    renderStats();
    initTheme();

    document.getElementById("openAddModalBtn").onclick = openAddModal;
    document.getElementById("saveTaskBtn").onclick = saveTask;
    document.getElementById("closeModalBtn").onclick = closeModal;
    document.getElementById("clearAllCompletedBtn").onclick = () => {
        if (confirm("Hapus semua tugas yang sudah selesai?")) {
            tasks = tasks.filter(t => !t.completed);
            saveToLocal();
            refreshPage();
            showCenterPopup("🧹 Semua tugas selesai dihapus", "🧹");
        }
    };
    document.getElementById("addCategoryBtn").onclick = () => {
        let newCat = prompt("Nama kategori baru:");
        if (newCat && newCat.trim() && !categories.includes(newCat.trim())) {
            categories.push(newCat.trim());
            saveToLocal();
            updateCategoryDropdowns();
            renderStats();
            refreshPage();
            showCenterPopup(`🏷️ Kategori "${newCat}" ditambahkan`, "🏷️");
        } else if (categories.includes(newCat?.trim())) showCenterPopup("Kategori sudah ada", "⚠️");
    };

    const infoModal = document.getElementById("infoModal");
    document.getElementById("infoBtn").onclick = () => infoModal.style.display = "flex";
    document.getElementById("closeInfoBtn").onclick = () => infoModal.style.display = "none";
    window.onclick = (e) => {
        if (e.target === infoModal) infoModal.style.display = "none";
        if (e.target === document.getElementById("taskModal")) closeModal();
    };

    document.getElementById("searchActive").addEventListener("input", renderActiveTasks);
    document.getElementById("filterPriorityActive").addEventListener("change", renderActiveTasks);
    document.getElementById("filterCategoryActive").addEventListener("change", renderActiveTasks);
    document.getElementById("searchCompleted").addEventListener("input", renderCompletedTasks);
    document.getElementById("filterPriorityCompleted").addEventListener("change", renderCompletedTasks);
    document.getElementById("filterCategoryCompleted").addEventListener("change", renderCompletedTasks);

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentPage = btn.dataset.page;
            document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
            if (currentPage === "tasks") document.getElementById("tasksPage").classList.add("active-page");
            else if (currentPage === "completed") document.getElementById("completedPage").classList.add("active-page");
            else if (currentPage === "stats") document.getElementById("statsPage").classList.add("active-page");
            refreshPage();
        };
    });

    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const theme = btn.getAttribute("data-theme");
            setTheme(theme);
        });
    });
});