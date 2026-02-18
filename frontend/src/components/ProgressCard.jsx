import React from "react";

function ProgressCard({ total, completed }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="panel progress-panel">
      <div className="progress-top">
        <h3>Progress</h3>
        <span>{percent}% complete</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p>
        {completed}/{total} tasks finished
      </p>
    </section>
  );
}

export default ProgressCard;

