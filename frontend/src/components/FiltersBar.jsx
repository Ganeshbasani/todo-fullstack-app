import React from "react";
import { Search } from "lucide-react";

function FiltersBar({ filters, onChange, categories }) {
  return (
    <section className="panel filters-panel">
      <div className="filters-top">
        <div className="search-wrap">
          <Search size={16} />
          <input
            placeholder="Search tasks..."
            value={filters.query}
            onChange={(e) => onChange("query", e.target.value)}
          />
        </div>
      </div>

      <div className="chip-row">
        {["all", "active", "completed"].map((status) => (
          <button
            key={status}
            className={`chip ${filters.status === status ? "active" : ""}`}
            onClick={() => onChange("status", status)}
          >
            {status[0].toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="filter-grid">
        <label>
          Priority
          <select
            value={filters.priority}
            onChange={(e) => onChange("priority", e.target.value)}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <label>
          Category
          <select
            value={filters.category}
            onChange={(e) => onChange("category", e.target.value)}
          >
            <option value="all">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export default FiltersBar;

