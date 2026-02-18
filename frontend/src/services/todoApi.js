import axios from "axios";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL || "http://localhost:8001"}/api`;
const OFFLINE_KEY = "todo_offline_fallback_v1";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

function readOfflineTodos() {
  try {
    const raw = window.localStorage.getItem(OFFLINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOfflineTodos(todos) {
  window.localStorage.setItem(OFFLINE_KEY, JSON.stringify(todos));
}

function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function fetchTodos(status = "all") {
  const params = {};
  if (status === "active") params.completed = false;
  if (status === "completed") params.completed = true;
  try {
    const res = await client.get("/todos", { params });
    return res.data;
  } catch {
    const offline = readOfflineTodos();
    const filtered =
      status === "active"
        ? offline.filter((todo) => !todo.completed)
        : status === "completed"
          ? offline.filter((todo) => todo.completed)
          : offline;
    return sortByCreatedAtDesc(filtered);
  }
}

export async function createTodo(payload) {
  try {
    const res = await client.post("/todos", payload);
    return res.data;
  } catch {
    const offline = readOfflineTodos();
    const created = {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: payload.title,
      description: payload.description || "",
      completed: Boolean(payload.completed),
      createdAt: new Date().toISOString(),
    };
    writeOfflineTodos([created, ...offline]);
    return created;
  }
}

export async function updateTodo(id, payload) {
  try {
    const res = await client.put(`/todos/${id}`, payload);
    return res.data;
  } catch {
    const offline = readOfflineTodos();
    const next = offline.map((todo) => (todo.id === id ? { ...todo, ...payload } : todo));
    writeOfflineTodos(next);
    return next.find((todo) => todo.id === id);
  }
}

export async function deleteTodo(id) {
  try {
    await client.delete(`/todos/${id}`);
  } catch {
    const offline = readOfflineTodos();
    writeOfflineTodos(offline.filter((todo) => todo.id !== id));
  }
}
