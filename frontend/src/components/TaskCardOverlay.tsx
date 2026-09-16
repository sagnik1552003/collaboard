import type { Task } from "../types";
import "./TaskCard.css";

export default function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="task-card task-card-flying">
      <div className="task-card-top">
        <p className="task-card-title">{task.title}</p>
      </div>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-foot">
        <span className="task-card-pos">#{String(task.position + 1).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
