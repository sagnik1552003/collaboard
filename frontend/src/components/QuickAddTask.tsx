import { FormEvent, useState } from "react";

interface QuickAddTaskProps {
  onAdd: (title: string) => void;
}

export default function QuickAddTask({ onAdd }: QuickAddTaskProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  if (!open) {
    return (
      <button type="button" className="quick-add-trigger" onClick={() => setOpen(true)}>
        + Add task
      </button>
    );
  }

  return (
    <form className="quick-add-form" onSubmit={submit}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        maxLength={200}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setTitle("");
          }
        }}
        onBlur={() => {
          if (!title.trim()) setOpen(false);
        }}
      />
      <div className="quick-add-actions">
        <button type="submit" className="btn btn-primary quick-add-submit">
          Add
        </button>
        <button
          type="button"
          className="btn btn-ghost quick-add-submit"
          onClick={() => {
            setOpen(false);
            setTitle("");
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
