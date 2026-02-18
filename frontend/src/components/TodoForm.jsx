import React from "react";
import { CalendarDays, Plus, Tag } from "lucide-react";
import { motion } from "framer-motion";

function TodoForm({ form, onChange, onSubmit, isSubmitting, validationError }) {
  return (
    <motion.form
      className="panel todo-form"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="form-row">
        <label htmlFor="title">Task</label>
        <input
          id="title"
          autoFocus
          required
          maxLength={200}
          placeholder="Ship dashboard redesign"
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
        />
      </div>

      <div className="form-row">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          maxLength={1000}
          placeholder="Add clean micro interactions and onboarding hints."
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>

      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={form.priority}
            onChange={(e) => onChange("priority", e.target.value)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="dueDate">
            <CalendarDays size={14} /> Due Date
          </label>
          <input
            id="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(e) => onChange("dueDate", e.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="category">
            <Tag size={14} /> Category
          </label>
          <input
            id="category"
            maxLength={30}
            placeholder="Work"
            value={form.category}
            onChange={(e) => onChange("category", e.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="tags">Tags</label>
          <input
            id="tags"
            placeholder="frontend, sprint"
            value={form.tags}
            onChange={(e) => onChange("tags", e.target.value)}
          />
        </div>
      </div>

      {validationError ? <p className="field-error">{validationError}</p> : null}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        <Plus size={16} />
        {isSubmitting ? "Adding..." : "Add Task"}
      </button>
    </motion.form>
  );
}

export default TodoForm;

