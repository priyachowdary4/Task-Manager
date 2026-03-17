document.addEventListener("DOMContentLoaded", () => {
    // State management
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    let trash = JSON.parse(localStorage.getItem("trash")) || [];
    let statusFilter = "all";
    let priorityFilter = "all";
    let searchText = "";
    let currentPage = 1;
    let currentEditId = null;
    const PAGE_SIZE = 5;

    // Element Selectors
    const list = document.getElementById("taskList");
    const dueInput = document.getElementById("due");
    const editDueInput = document.getElementById("editDue");
    const multiDeleteBtn = document.getElementById("multiDeleteBtn");
    const trashCountSpan = document.getElementById("trashCount");

    /**
     * CORE FUNCTIONALITY: DATE BLOCKING
     */
    const setMinDate = () => {
        const today = new Date().toISOString().split("T")[0];
        dueInput.min = today;
        if (editDueInput) editDueInput.min = today;
    };
    setMinDate();

    const isDateInvalid = (dateStr) => {
        if (!dateStr) return false;
        const selectedDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today;
    };

    /**
     * PERSISTENCE
     */
    async function save() {
        localStorage.setItem("todos", JSON.stringify(todos));
        localStorage.setItem("trash", JSON.stringify(trash));
        trashCountSpan.textContent = trash.length;
    }

    /**
     * TASK ACTIONS: CREATE, TOGGLE, DELETE
     */
    document.getElementById("addBtn").onclick = async () => {
        const title = document.getElementById("title").value.trim();
        const desc = document.getElementById("desc").value.trim();
        const due = dueInput.value;
        const priority = document.getElementById("priority").value;

        if (!title) return alert("Title is required!");
        if (isDateInvalid(due)) return alert("Past dates are not allowed!");

        const newTask = {
            id: Date.now(),
            title,
            desc,
            due,
            priority,
            completed: false,
            createdAt: new Date().toLocaleString(),
            updatedAt: null
        };

        todos.unshift(newTask);
        clearForm();
        await save();
        render();
    };

    window.toggleTask = async (id) => {
        const t = todos.find(x => x.id === id);
        if (t) {
            t.completed = !t.completed;
            t.updatedAt = new Date().toLocaleString();
            await save();
            render();
        }
    };

    window.deleteTask = async (id) => {
        const t = todos.find(x => x.id === id);
        if (!t) return;

        // Custom priority-based confirmation
        const message = `⚠️ ATTENTION: This is a ${t.priority.toUpperCase()} priority task! \n\nAre you sure you want to delete it?`;
        
        // Force the user to write something about the task as requested
        const userNote = prompt(`${message}\n\nPlease enter a reason or note about this task to confirm deletion:`);

        if (userNote !== null) {
            t.deletionNote = userNote || "No reason provided";
            trash.push(t);
            todos = todos.filter(x => x.id !== id);
            await save();
            render();
        }
    };

    /**
     * BULK ACTIONS
     */
    const updateBulkButtonState = () => {
        const checkedCount = document.querySelectorAll(".task-checkbox:checked").length;
        multiDeleteBtn.disabled = checkedCount === 0;
    };

    multiDeleteBtn.onclick = async () => {
        const checkedBoxes = document.querySelectorAll(".task-checkbox:checked");
        if (checkedBoxes.length === 0) return;

        if (confirm(`Delete ${checkedBoxes.length} selected tasks?`)) {
            const selectedIds = Array.from(checkedBoxes).map(cb => Number(cb.dataset.id));
            const toTrash = todos.filter(t => selectedIds.includes(t.id));
            
            trash.push(...toTrash);
            todos = todos.filter(t => !selectedIds.includes(t.id));
            
            await save();
            render();
        }
    };

    document.getElementById("clearCompletedBtn").onclick = async () => {
        const completedTasks = todos.filter(t => t.completed);
        if (completedTasks.length === 0) return;

        if (confirm("Move all completed tasks to trash?")) {
            trash.push(...completedTasks);
            todos = todos.filter(t => !t.completed);
            await save();
            render();
        }
    };

    /**
     * MODAL EDIT LOGIC
     */
    window.openEdit = (id) => {
        const t = todos.find(x => x.id === id);
        if (!t || t.completed) return; // Unnecessary buttons should not work for completed

        currentEditId = id;
        document.getElementById("editTitle").value = t.title;
        document.getElementById("editDesc").value = t.desc;
        document.getElementById("editDue").value = t.due || "";
        document.getElementById("editPriority").value = t.priority;
        document.getElementById("editModal").classList.remove("hidden");
    };

    document.getElementById("updateTask").onclick = async () => {
        const t = todos.find(x => x.id === currentEditId);
        const newDue = editDueInput.value;

        if (isDateInvalid(newDue)) return alert("Cannot update to a past date!");

        t.title = document.getElementById("editTitle").value.trim();
        t.desc = document.getElementById("editDesc").value.trim();
        t.due = newDue;
        t.priority = document.getElementById("editPriority").value;
        t.updatedAt = new Date().toLocaleString();

        document.getElementById("editModal").classList.add("hidden");
        await save();
        render();
    };

    document.getElementById("closeModal").onclick = () => {
        document.getElementById("editModal").classList.add("hidden");
    };

    /**
     * IMPORT TASKS
     */
    document.getElementById("importTasks").onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    // Ensure basic structure exists for imported items
                    const validImport = imported.map(item => ({
                        ...item,
                        id: item.id || Date.now() + Math.random(),
                        createdAt: item.createdAt || new Date().toLocaleString()
                    }));
                    todos = [...validImport, ...todos];
                    await save();
                    render();
                    alert("Tasks imported successfully!");
                }
            } catch (err) {
                alert("Error importing file. Please ensure it is a valid JSON array.");
            }
        };
        reader.readAsText(file);
    };

    /**
     * FILTERS AND RENDERING
     */
    document.getElementById("search").oninput = (e) => {
        searchText = e.target.value.toLowerCase();
        render();
    };

    document.querySelectorAll(".filter").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            statusFilter = btn.dataset.status;
            currentPage = 1;
            render();
        };
    });

    document.getElementById("priorityFilter").onchange = (e) => {
        priorityFilter = e.target.value;
        currentPage = 1;
        render();
    };

    function clearForm() {
        document.getElementById("title").value = "";
        document.getElementById("desc").value = "";
        document.getElementById("due").value = "";
    }

    function getFiltered() {
        return todos.filter(t => {
            const matchesStatus = statusFilter === "all" || 
                (statusFilter === "active" ? !t.completed : t.completed);
            const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
            const matchesSearch = t.title.toLowerCase().includes(searchText) || 
                                 t.desc.toLowerCase().includes(searchText);
            return matchesStatus && matchesPriority && matchesSearch;
        });
    }

    function render() {
        const filtered = getFiltered();
        const start = (currentPage - 1) * PAGE_SIZE;
        const pagedTasks = filtered.slice(start, start + PAGE_SIZE);

        list.innerHTML = "";

        if (pagedTasks.length === 0) {
            list.innerHTML = `<p style="text-align:center; color:#888;">No tasks found.</p>`;
        }

        pagedTasks.forEach(t => {
            const div = document.createElement("div");
            div.className = `task ${t.priority} ${t.completed ? 'completed' : ''}`;
            
            div.innerHTML = `
                <input type="checkbox" class="task-checkbox" data-id="${t.id}" ${t.completed ? 'style="visibility:hidden"' : ''}>
                <div class="task-content">
                    <div style="display:flex; justify-content:space-between;">
                        <span class="task-title"><strong>${t.title}</strong></span>
                        <span class="badge ${t.priority}">${t.priority.toUpperCase()}</span>
                    </div>
                    <p class="task-desc">${t.desc || "<i>No description provided.</i>"}</p>
                    <div class="timestamps">
                        <small><i class="fa-regular fa-calendar-plus"></i> Created: ${t.createdAt}</small><br>
                        ${t.updatedAt ? `<small><i class="fa-solid fa-pen-to-square"></i> Updated: ${t.updatedAt}</small><br>` : ''}
                        <small><i class="fa-regular fa-calendar-check"></i> Due: ${t.due || 'No date set'}</small>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-primary" onclick="toggleTask(${t.id})">
                        ${t.completed ? '<i class="fa-solid fa-rotate-left"></i> Undo' : '<i class="fa-solid fa-check"></i> Complete'}
                    </button>
                    ${!t.completed ? `<button class="btn-secondary" onclick="openEdit(${t.id})"><i class="fa-solid fa-pen"></i> Edit</button>` : ''}
                    <button class="btn-danger" onclick="deleteTask(${t.id})"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            list.appendChild(div);
        });

        // Re-attach checkbox listeners for bulk delete
        document.querySelectorAll(".task-checkbox").forEach(cb => {
            cb.onchange = updateBulkButtonState;
        });

        renderPagination(Math.ceil(filtered.length / PAGE_SIZE));
        updateBulkButtonState();
        trashCountSpan.textContent = trash.length;
    }

    function renderPagination(total) {
        const p = document.getElementById("pagination");
        p.innerHTML = "";

        if (total <= 1) return;

        const prevBtn = document.createElement("button");
        prevBtn.textContent = "Prev";
        prevBtn.className = "btn-secondary";
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => { currentPage--; render(); };

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next";
        nextBtn.className = "btn-secondary";
        nextBtn.disabled = currentPage === total;
        nextBtn.onclick = () => { currentPage++; render(); };

        p.appendChild(prevBtn);
        const span = document.createElement("span");
        span.style.margin = "0 15px";
        span.textContent = `Page ${currentPage} of ${total}`;
        p.appendChild(span);
        p.appendChild(nextBtn);
    }

    // Initial Render
    render();
});