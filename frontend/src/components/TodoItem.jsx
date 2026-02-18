import React, { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  GripVertical,
  PencilLine,
  Save,
  Trash2,
  X,
} from "lucide-react";

function TodoItem({ todo, isSelected, onSelect, onToggle, onSaveEdit, onRequestDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState({
    title: todo.title,
    description: todo.description || "",
  });

  useEffect(() => {
    setEditValue({ title: todo.title, description: todo.description || "" });
  }, [todo.title, todo.description]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityClass = `priority priority-${todo.priority || "medium"}`;

  async function onSubmitEdit(e) {
    e.preventDefault();
    if (!editValue.title.trim()) return;
    await onSaveEdit(todo.id, editValue);
    setIsEditing(false);
  }

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className={`todo-card ${todo.completed ? "completed" : ""} ${isDragging ? "dragging" : ""}`}
    >
      <div className="todo-head">
        <label className="select-wrap">
          <input type="checkbox" checked={isSelected} onChange={() => onSelect(todo.id)} />
        </label>

        <button className="icon-btn btn-ghost drag-handle" {...attributes} {...listeners}>
          <GripVertical size={16} />
        </button>

        <button className="icon-btn btn-soft" onClick={() => onToggle(todo)}>
          <Check size={16} />
        </button>

        <div className="todo-meta">
          <span className={priorityClass}>{todo.priority || "medium"}</span>
          {todo.category ? <span className="badge">{todo.category}</span> : null}
          {todo.dueDate ? (
            <span className="badge">
              <CalendarClock size={14} />
              {todo.dueDate}
            </span>
          ) : null}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="todo-body"
          >
            <h3>{todo.title}</h3>
            {todo.description ? <p>{todo.description}</p> : null}
            {todo.tags?.length ? (
              <div className="tag-row">
                {todo.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.form
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="edit-form"
            onSubmit={onSubmitEdit}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsEditing(false);
                setEditValue({ title: todo.title, description: todo.description || "" });
              }
            }}
          >
            <input
              value={editValue.title}
              maxLength={200}
              onChange={(e) => setEditValue((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              value={editValue.description}
              maxLength={1000}
              onChange={(e) =>
                setEditValue((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <div className="edit-actions">
              <button type="submit" className="btn btn-primary">
                <Save size={15} />
                Save
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditValue({ title: todo.title, description: todo.description || "" });
                }}
              >
                <X size={15} />
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!isEditing ? (
        <div className="todo-actions">
          <button className="icon-btn btn-ghost" onClick={() => setIsEditing(true)}>
            <PencilLine size={16} />
          </button>
          <button className="icon-btn btn-danger" onClick={() => onRequestDelete(todo)}>
            <Trash2 size={16} />
          </button>
        </div>
      ) : null}
    </motion.li>
  );
}

export default TodoItem;

