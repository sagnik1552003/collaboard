import { FormEvent, useEffect, useState } from "react";
import type { Task } from "../types";
import "./TaskModal.css";

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, title: string, description: string) => void;
}

export default function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(task.id, trimmed, description.trim());
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal-panel"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2>Edit card</h2>

        <div className="field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="task-desc">Description</label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add more detail…"
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
