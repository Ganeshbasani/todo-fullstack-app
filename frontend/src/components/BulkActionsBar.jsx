import React from "react";
import { CheckCheck, Trash2 } from "lucide-react";

function BulkActionsBar({ selectedCount, onCompleteSelected, onDeleteSelected, onClearSelected }) {
  if (!selectedCount) return null;

  return (
    <section className="panel bulk-bar">
      <p>{selectedCount} selected</p>
      <div className="bulk-actions">
        <button className="btn btn-soft" onClick={onCompleteSelected}>
          <CheckCheck size={16} />
          Complete
        </button>
        <button className="btn btn-danger" onClick={onDeleteSelected}>
          <Trash2 size={16} />
          Delete
        </button>
        <button className="btn btn-ghost" onClick={onClearSelected}>
          Clear
        </button>
      </div>
    </section>
  );
}

export default BulkActionsBar;

