import React, { useEffect, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  createTodo,
  deleteTodo as apiDeleteTodo,
  fetchTodos as apiFetchTodos,
  updateTodo,
} from "./services/todoApi";
import { useLocalStorage } from "./hooks/useLocalStorage";
import TodoForm from "./components/TodoForm";
import FiltersBar from "./components/FiltersBar";
import ProgressCard from "./components/ProgressCard";
import BulkActionsBar from "./components/BulkActionsBar";
import TodoList from "./components/TodoList";
import ConfirmModal from "./components/ConfirmModal";
import EmptyState from "./components/EmptyState";
import SkeletonList from "./components/SkeletonList";
import ThemeToggle from "./components/ThemeToggle";
import "./App.css";

function parseTags(rawTags = "") {
  return rawTags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function sortBySavedOrder(items, order) {
  const indexMap = new Map(order.map((id, idx) => [id, idx]));
  return [...items].sort((a, b) => {
    const ai = indexMap.has(a.id) ? indexMap.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bi = indexMap.has(b.id) ? indexMap.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

function reorderWithinVisible(allItems, visibleIds, activeId, overId) {
  const visibleSet = new Set(visibleIds);
  const visibleItems = allItems.filter((item) => visibleSet.has(item.id));
  const oldIndex = visibleItems.findIndex((item) => item.id === activeId);
  const newIndex = visibleItems.findIndex((item) => item.id === overId);
  if (oldIndex < 0 || newIndex < 0) return allItems;
  const moved = arrayMove(visibleItems, oldIndex, newIndex);
  let cursor = 0;
  return allItems.map((item) => (visibleSet.has(item.id) ? moved[cursor++] : item));
}

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [theme, setTheme] = useLocalStorage("todo_theme_v1", "light");
  const [metaById, setMetaById] = useLocalStorage("todo_meta_v1", {});
  const [savedOrder, setSavedOrder] = useLocalStorage("todo_order_v1", []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, ids: [], mode: "single" });
  const [filters, setFilters] = useState({
    query: "",
    status: "all",
    priority: "all",
    category: "all",
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    category: "",
    tags: "",
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    async function loadTodos() {
      setLoading(true);
      setApiError("");
      try {
        const remoteTodos = await apiFetchTodos("all");
        const merged = remoteTodos.map((todo) => {
          const meta = metaById[todo.id] || {};
          return {
            ...todo,
            priority: meta.priority || "medium",
            dueDate: meta.dueDate || "",
            category: meta.category || "",
            tags: meta.tags || [],
          };
        });
        const sorted = sortBySavedOrder(merged, savedOrder);
        setTodos(sorted);
        if (!savedOrder.length) {
          setSavedOrder(sorted.map((todo) => todo.id));
        }
      } catch (err) {
        setApiError(err?.response?.data?.detail || "Failed to fetch todos");
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, []);

  useEffect(() => {
    function onEscape(e) {
      if (e.key === "Escape") {
        setConfirmState((prev) => ({ ...prev, open: false }));
        setValidationError("");
      }
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const categories = useMemo(() => {
    const list = new Set();
    todos.forEach((todo) => {
      if (todo.category) list.add(todo.category);
    });
    return Array.from(list).sort();
  }, [todos]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const query = filters.query.trim().toLowerCase();
      const matchesQuery =
        !query ||
        todo.title.toLowerCase().includes(query) ||
        (todo.description || "").toLowerCase().includes(query) ||
        (todo.tags || []).some((tag) => tag.includes(query));
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && !todo.completed) ||
        (filters.status === "completed" && todo.completed);
      const matchesPriority = filters.priority === "all" || todo.priority === filters.priority;
      const matchesCategory = filters.category === "all" || todo.category === filters.category;
      return matchesQuery && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [todos, filters]);

  const totalCount = todos.length;
  const completedCount = todos.filter((todo) => todo.completed).length;

  function onFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onAddTodo(e) {
    e.preventDefault();
    const trimmed = form.title.trim();
    if (!trimmed) {
      setValidationError("Task title is required.");
      return;
    }
    if (trimmed.length < 3) {
      setValidationError("Task title should have at least 3 characters.");
      return;
    }
    setValidationError("");
    setSubmitting(true);
    try {
      const created = await createTodo({
        title: trimmed,
        description: form.description.trim(),
        completed: false,
      });
      const nextMeta = {
        priority: form.priority,
        dueDate: form.dueDate,
        category: form.category.trim(),
        tags: parseTags(form.tags),
      };
      setMetaById((prev) => ({ ...prev, [created.id]: nextMeta }));
      const merged = {
        ...created,
        ...nextMeta,
      };
      setTodos((prev) => [merged, ...prev]);
      setSavedOrder((prev) => [created.id, ...prev.filter((id) => id !== created.id)]);
      setForm({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        category: "",
        tags: "",
      });
      toast.success("Task added");
    } catch (err) {
      setApiError(err?.response?.data?.detail || "Failed to add todo");
      toast.error("Unable to add task");
    } finally {
      setSubmitting(false);
    }
  }

  async function onToggleTodo(todo) {
    const before = todo.completed;
    setTodos((prev) =>
      prev.map((item) => (item.id === todo.id ? { ...item, completed: !item.completed } : item))
    );
    try {
      await updateTodo(todo.id, { completed: !before });
      toast.success(before ? "Marked active" : "Marked completed");
    } catch (err) {
      setTodos((prev) =>
        prev.map((item) => (item.id === todo.id ? { ...item, completed: before } : item))
      );
      setApiError(err?.response?.data?.detail || "Failed to update todo");
      toast.error("Update failed");
    }
  }

  async function onSaveEdit(todoId, values) {
    const updatedTitle = values.title.trim();
    if (!updatedTitle) return;
    const prevItem = todos.find((todo) => todo.id === todoId);
    if (!prevItem) return;

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? { ...todo, title: updatedTitle, description: values.description.trim() }
          : todo
      )
    );
    try {
      await updateTodo(todoId, {
        title: updatedTitle,
        description: values.description.trim(),
      });
      toast.success("Task updated");
    } catch (err) {
      setTodos((prev) => prev.map((todo) => (todo.id === todoId ? prevItem : todo)));
      setApiError(err?.response?.data?.detail || "Failed to update todo");
      toast.error("Update failed");
    }
  }

  function askDelete(todo) {
    setConfirmState({ open: true, ids: [todo.id], mode: "single" });
  }

  function askBulkDelete() {
    if (!selectedIds.length) return;
    setConfirmState({ open: true, ids: selectedIds, mode: "bulk" });
  }

  async function deleteIds(ids) {
    const removed = todos.filter((todo) => ids.includes(todo.id));
    setTodos((prev) => prev.filter((todo) => !ids.includes(todo.id)));
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    setSavedOrder((prev) => prev.filter((id) => !ids.includes(id)));

    try {
      await Promise.all(ids.map((id) => apiDeleteTodo(id)));
      if (ids.length === 1) {
        const deleted = removed[0];
        toast(
          (t) => (
            <span>
              Task deleted.
              <button
                className="toast-undo"
                onClick={async () => {
                  toast.dismiss(t.id);
                  try {
                    const recreated = await createTodo({
                      title: deleted.title,
                      description: deleted.description || "",
                      completed: deleted.completed,
                    });
                    setMetaById((prev) => ({
                      ...prev,
                      [recreated.id]: {
                        priority: deleted.priority || "medium",
                        dueDate: deleted.dueDate || "",
                        category: deleted.category || "",
                        tags: deleted.tags || [],
                      },
                    }));
                    setTodos((prev) => [{ ...recreated, ...deleted, id: recreated.id }, ...prev]);
                    setSavedOrder((prev) => [recreated.id, ...prev]);
                    toast.success("Delete undone");
                  } catch {
                    toast.error("Undo failed");
                  }
                }}
              >
                Undo
              </button>
            </span>
          ),
          { duration: 6000 }
        );
      } else {
        toast.success(`${ids.length} tasks deleted`);
      }
    } catch (err) {
      setTodos((prev) => [...removed, ...prev]);
      setApiError(err?.response?.data?.detail || "Failed to delete todo");
      toast.error("Delete failed");
    }
  }

  function onSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onCompleteSelected() {
    const targets = todos.filter((todo) => selectedIds.includes(todo.id) && !todo.completed);
    if (!targets.length) return;
    setTodos((prev) =>
      prev.map((todo) => (selectedIds.includes(todo.id) ? { ...todo, completed: true } : todo))
    );
    try {
      await Promise.all(targets.map((todo) => updateTodo(todo.id, { completed: true })));
      toast.success("Selected tasks completed");
      setSelectedIds([]);
    } catch {
      toast.error("Bulk complete failed");
    }
  }

  function onClearSelected() {
    setSelectedIds([]);
  }

  function onFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTodos((prev) => {
      const visibleIds = filteredTodos.map((todo) => todo.id);
      const next = reorderWithinVisible(prev, visibleIds, active.id, over.id);
      setSavedOrder(next.map((todo) => todo.id));
      return next;
    });
  }

  async function confirmDelete() {
    await deleteIds(confirmState.ids);
    setConfirmState({ open: false, ids: [], mode: "single" });
  }

  return (
    <motion.div
      className="app-shell"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Toaster position="top-right" />

      <header className="app-header">
        <div>
          <h1>Pulse Tasks</h1>
          <p>High-focus task workspace for modern teams</p>
        </div>
        <ThemeToggle
          theme={theme}
          onToggle={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        />
      </header>

      <div className="dashboard-grid">
        <div className="stack">
          <TodoForm
            form={form}
            onChange={onFormChange}
            onSubmit={onAddTodo}
            isSubmitting={submitting}
            validationError={validationError}
          />
          <FiltersBar filters={filters} onChange={onFilterChange} categories={categories} />
          {apiError ? <p className="api-error">{apiError}</p> : null}
          <BulkActionsBar
            selectedCount={selectedIds.length}
            onCompleteSelected={onCompleteSelected}
            onDeleteSelected={askBulkDelete}
            onClearSelected={onClearSelected}
          />
          {loading ? (
            <SkeletonList />
          ) : filteredTodos.length ? (
            <TodoList
              todos={filteredTodos}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onToggle={onToggleTodo}
              onSaveEdit={onSaveEdit}
              onRequestDelete={askDelete}
              onDragEnd={onDragEnd}
            />
          ) : (
            <EmptyState />
          )}
        </div>
        <aside className="stack side-panel">
          <ProgressCard total={totalCount} completed={completedCount} />
        </aside>
      </div>

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.mode === "bulk" ? "Delete selected tasks?" : "Delete this task?"}
        message="This action removes task data from server and cannot be reversed automatically."
        confirmLabel={confirmState.mode === "bulk" ? "Delete Selected" : "Delete"}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDelete}
      />
    </motion.div>
  );
}

export default App;
