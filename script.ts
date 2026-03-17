/**
 * TASK INTERFACE
 * Defining the structure of our Task object
 */
interface Task {
    id: number;
    title: string;
    desc: string;
    due: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    createdAt: string;
    updatedAt: string | null;
    deletionNote?: string;
}

document.addEventListener("DOMContentLoaded", () => {
    // State management with Type Casting
    let todos: Task[] = JSON.parse(localStorage.getItem("todos") || "[]");
    let trash: Task[] = JSON.parse(localStorage.getItem("trash") || "[]");
    
    let statusFilter: string = "all";
    let priorityFilter: string = "all";
    let searchText: string = "";
    let currentPage: number = 1;
    let currentEditId: number | null = null;
    const PAGE_SIZE: number = 5;

    // Element Selectors with Type Assertions
    const list = document.getElementById("taskList") as HTMLDivElement;
    const dueInput = document.getElementById("due") as HTMLInputElement;
    const editDueInput = document.getElementById("editDue") as HTMLInputElement;
    const multiDeleteBtn = document.getElementById("multiDeleteBtn") as HTMLButtonElement;
    const trashCountSpan = document.getElementById("trashCount") as HTMLSpanElement;

    // DATE BLOCKING LOGIC
    const setMinDate = (): void => {
        const today = new Date().toISOString().split("T")[0];
        if (dueInput) dueInput.min = today;
        if (editDueInput) editDueInput.min = today;
    };
    setMinDate();

    const isDateInvalid = (dateStr: string): boolean => {
        if (!dateStr) return false;
        const selectedDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today;
    };

    const save = (): void => {
        localStorage.setItem("todos", JSON.stringify(todos));
        localStorage.setItem("trash", JSON.stringify(trash));
        if (trashCountSpan) trashCountSpan.textContent = trash.length.toString();
    };

    // ADD TASK
    const addBtn = document.getElementById("addBtn");
    if (addBtn) {
        addBtn.onclick = () => {
            const titleInput = document.getElementById("title") as HTMLInputElement;
            const descInput = document.getElementById("desc") as HTMLTextAreaElement;
            const priorityInput = document.getElementById("priority") as HTMLSelectElement;

            const title = titleInput.value.trim();
            const due = dueInput.value;

            if (!title) return alert("Title is required!");
            if (isDateInvalid(due)) return alert("Past dates are not allowed!");

            const newTask: Task = {
                id: Date.now(),
                title,
                desc: descInput.value,
                due,
                priority: priorityInput.value as 'low' | 'medium' | 'high',
                completed: false,
                createdAt: new Date().toLocaleString(),
                updatedAt: null
            };

            todos.unshift(newTask);
            titleInput.value = "";
            descInput.value = "";
            dueInput.value = "";
            save();
            render();
        };
    }

    // DELETE TASK WITH NOTE
    (window as any).deleteTask = (id: number): void => {
        const t = todos.find(x => x.id === id);
        if (!t) return;

        const message = `⚠️ This is a ${t.priority.toUpperCase()} priority task!`;
        const userNote = prompt(`${message}\n\nPlease enter a brief note about this task to confirm deletion:`);

        if (userNote !== null) {
            t.deletionNote = userNote || "No note provided";
            trash.push(t);
            todos = todos.filter(x => x.id !== id);
            save();
            render();
        }
    };

    // TOGGLE COMPLETE
    (window as any).toggleTask = (id: number): void => {
        const t = todos.find(x => x.id === id);
        if (t) {
            t.completed = !t.completed;
            t.updatedAt = new Date().toLocaleString();
            save();
            render();
        }
    };

    // RENDERING LOGIC
    function render(): void {
        const filtered = todos.filter(t => {
            const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? !t.completed : t.completed);
            const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
            const matchesSearch = t.title.toLowerCase().includes(searchText);
            return matchesStatus && matchesPriority && matchesSearch;
        });

        const start = (currentPage - 1) * PAGE_SIZE;
        const paged = filtered.slice(start, start + PAGE_SIZE);

        list.innerHTML = "";
        paged.forEach(t => {
            const div = document.createElement("div");
            div.className = `task ${t.priority} ${t.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <input type="checkbox" class="task-checkbox" data-id="${t.id}" ${t.completed ? 'disabled' : ''}>
                <div class="task-content">
                    <strong>${t.title}</strong>
                    <p>${t.desc}</p>
                    <small>Created: ${t.createdAt} | Due: ${t.due || 'N/A'}</small>
                </div>
                <div class="task-actions">
                    <button class="btn-primary" onclick="toggleTask(${t.id})">${t.completed ? 'Undo' : 'Done'}</button>
                    ${!t.completed ? `<button class="btn-secondary" onclick="openEdit(${t.id})">Edit</button>` : ''}
                    <button class="btn-danger" onclick="deleteTask(${t.id})">Delete</button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    // Initial load
    render();
});