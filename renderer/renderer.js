const state = {
  projects: [],
  currentProjectId: null
};

const projectListEl = document.getElementById("project-list");
const projectFormEl = document.getElementById("project-form");
const projectNameInputEl = document.getElementById("project-name-input");

const emptyStateEl = document.getElementById("empty-state");
const boardContentEl = document.getElementById("board-content");
const currentProjectNameEl = document.getElementById("current-project-name");

const taskListEl = document.getElementById("task-list");
const taskFormEl = document.getElementById("task-form");
const taskTextInputEl = document.getElementById("task-text-input");

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function loadInitialData() {
  try {
    const loaded = await window.taskApi.load();
    if (loaded && Array.isArray(loaded.projects)) {
      state.projects = loaded.projects;
      if (state.projects.length > 0) {
        state.currentProjectId = state.projects[0].id;
      }
    }
    render();
  } catch {
    render();
  }
}

async function persist() {
  await window.taskApi.save({ projects: state.projects });
}

function getCurrentProject() {
  return state.projects.find((p) => p.id === state.currentProjectId) || null;
}

function render() {
  renderProjects();
  renderBoard();
}

function renderProjects() {
  projectListEl.innerHTML = "";

  state.projects.forEach((project) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "project-item" + (project.id === state.currentProjectId ? " active" : "");

    const nameSpan = document.createElement("span");
    nameSpan.className = "project-name";
    nameSpan.textContent = project.name;

    const countSpan = document.createElement("span");
    countSpan.className = "project-count";
    const activeCount = project.tasks.filter((t) => !t.completed).length;
    countSpan.textContent = activeCount.toString();

    item.appendChild(nameSpan);
    item.appendChild(countSpan);

    item.addEventListener("click", () => {
      state.currentProjectId = project.id;
      render();
    });

    projectListEl.appendChild(item);
  });
}

function renderBoard() {
  const current = getCurrentProject();

  if (!current) {
    emptyStateEl.style.display = "flex";
    boardContentEl.classList.add("hidden");
    return;
  }

  emptyStateEl.style.display = "none";
  boardContentEl.classList.remove("hidden");

  currentProjectNameEl.textContent = current.name;

  taskListEl.innerHTML = "";

  current.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const main = document.createElement("div");
    main.className = "task-main";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;

    const textSpan = document.createElement("span");
    textSpan.className = "task-text" + (task.completed ? " completed" : "");
    textSpan.textContent = task.text;

    checkbox.addEventListener("change", async () => {
      task.completed = checkbox.checked;
      await persist();
      render();
    });

    main.appendChild(checkbox);
    main.appendChild(textSpan);

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "task-delete";
    deleteBtn.textContent = "Удалить";

    deleteBtn.addEventListener("click", async () => {
      const project = getCurrentProject();
      if (!project) {
        return;
      }
      project.tasks = project.tasks.filter((t) => t.id !== task.id);
      await persist();
      render();
    });

    meta.appendChild(deleteBtn);

    li.appendChild(main);
    li.appendChild(meta);

    taskListEl.appendChild(li);
  });
}

projectFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = projectNameInputEl.value.trim();
  if (!name) {
    return;
  }

  const newProject = {
    id: generateId(),
    name,
    tasks: []
  };

  state.projects.push(newProject);
  state.currentProjectId = newProject.id;
  projectNameInputEl.value = "";

  await persist();
  render();
});

taskFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = taskTextInputEl.value.trim();
  if (!text) {
    return;
  }

  const project = getCurrentProject();
  if (!project) {
    return;
  }

  const newTask = {
    id: generateId(),
    text,
    completed: false
  };

  project.tasks.unshift(newTask);
  taskTextInputEl.value = "";

  await persist();
  render();
});

document.addEventListener("DOMContentLoaded", () => {
  loadInitialData();
});

