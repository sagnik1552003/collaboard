import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types";
import "./TaskCard.css";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card${isDragging ? " task-card-ghost" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-top">
        <p className="task-card-title">{task.title}</p>
        <div
          className="task-card-menu-wrap"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false);
          }}
        >
          <button
            type="button"
            className="task-card-menu-btn"
            aria-label="Task actions"
            aria-expanded={menuOpen}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            &#8942;
          </button>
          {menuOpen && (
            <div className="task-card-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(task);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                className="task-card-menu-danger"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm(`Delete "${task.title}"?`)) onDelete(task.id);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && <p className="task-card-desc">{task.description}</p>}

      <div className="task-card-foot">
        <span className="task-card-pos">#{String(task.position + 1).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
