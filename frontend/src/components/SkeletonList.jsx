import React from "react";

function SkeletonList() {
  return (
    <ul className="todo-list">
      {[1, 2, 3].map((key) => (
        <li key={key} className="todo-card skeleton">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-sub" />
        </li>
      ))}
    </ul>
  );
}

export default SkeletonList;

