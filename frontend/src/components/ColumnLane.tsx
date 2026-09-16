import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Column, Task } from "../types";
import TaskCard from "./TaskCard";
import QuickAddTask from "./QuickAddTask";
import "./ColumnLane.css";

interface ColumnLaneProps {
  column: Column;
  onAddTask: (columnId: string, title: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMN_TONE: Record<string, string> = {
  Todo: "todo",
  Doing: "doing",
  Done: "done",
};

export default function ColumnLane({ column, onAddTask, onEditTask, onDeleteTask }: ColumnLaneProps) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const tone = COLUMN_TONE[column.name] ?? "todo";

  return (
    <div className="column-lane">
      <div className="column-lane-head">
        <span className={`column-tone column-tone-${tone}`} aria-hidden="true" />
        <h3>{column.name}</h3>
        <span className="column-count">{column.tasks.length}</span>
      </div>

      <div className="column-lane-body" ref={setNodeRef}>
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
        </SortableContext>
        {column.tasks.length === 0 && <p className="column-empty">No cards yet.</p>}
      </div>

      <QuickAddTask onAdd={(title) => onAddTask(column.id, title)} />
    </div>
  );
}
