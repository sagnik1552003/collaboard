import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { getBoard, ApiError } from "../lib/api";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useBoardSocket } from "../hooks/useBoardSocket";
import type { Board, Column, Task } from "../types";
import ColumnLane from "../components/ColumnLane";
import TaskCardOverlay from "../components/TaskCardOverlay";
import TaskModal from "../components/TaskModal";
import "./Board.css";

interface BoardPageProps {
  boardId: string;
  navigate: (path: string) => void;
}

function findColumnOf(columns: Column[], id: string): Column | undefined {
  return columns.find((c) => c.id === id) ?? columns.find((c) => c.tasks.some((t) => t.id === id));
}

export default function BoardPage({ boardId, navigate }: BoardPageProps) {
  const [userName] = useLocalStorage("collaboard:userName", "");
  const [initialBoard, setInitialBoard] = useState<Board | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!userName.trim()) {
      navigate("/");
      return;
    }

    getBoard(boardId)
      .then(setInitialBoard)
      .catch((err) =>
        setLoadError(err instanceof ApiError && err.status === 404 ? "This board doesn't exist." : "Couldn't load the board.")
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  if (loadError) {
    return (
      <div className="board-status">
        <p>{loadError}</p>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>
          Back home
        </button>
      </div>
    );
  }

  if (!initialBoard) {
    return (
      <div className="board-status">
        <p>Loading board…</p>
      </div>
    );
  }

  return <BoardView boardId={boardId} userName={userName} initialBoard={initialBoard} navigate={navigate} />;
}

interface BoardViewProps {
  boardId: string;
  userName: string;
  initialBoard: Board;
  navigate: (path: string) => void;
}

function BoardView({ boardId, userName, initialBoard, navigate }: BoardViewProps) {
  const { board, connection, notice, createTask, updateTask, deleteTask, moveTask } = useBoardSocket(
    boardId,
    userName,
    initialBoard
  );

  const [columns, setColumns] = useState<Column[]>(board.columns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeId) setColumns(board.columns);
  }, [board, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeTask = activeId
    ? columns.flatMap((c) => c.tasks).find((t) => t.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedId = String(active.id);
    const targetId = String(over.id);
    if (draggedId === targetId) return;

    const fromColumn = findColumnOf(columns, draggedId);
    const toColumn = findColumnOf(columns, targetId);
    if (!fromColumn || !toColumn || fromColumn.id === toColumn.id) return;

    setColumns((prev) => {
      const from = prev.find((c) => c.id === fromColumn.id)!;
      const to = prev.find((c) => c.id === toColumn.id)!;
      const task = from.tasks.find((t) => t.id === draggedId);
      if (!task) return prev;

      const overIndex = to.tasks.findIndex((t) => t.id === targetId);
      const insertAt = overIndex === -1 ? to.tasks.length : overIndex;
      const nextTo = [...to.tasks];
      nextTo.splice(insertAt, 0, { ...task, columnId: to.id });

      return prev.map((c) => {
        if (c.id === from.id) return { ...c, tasks: from.tasks.filter((t) => t.id !== draggedId) };
        if (c.id === to.id) return { ...c, tasks: nextTo };
        return c;
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const targetId = String(over.id);
    const column = findColumnOf(columns, draggedId);
    if (!column) return;

    const items = column.tasks;
    const fromIndex = items.findIndex((t) => t.id === draggedId);
    let toIndex = items.findIndex((t) => t.id === targetId);
    if (toIndex === -1) toIndex = items.length - 1;

    const reordered = fromIndex === toIndex ? items : arrayMove(items, fromIndex, toIndex);
    setColumns((prev) => prev.map((c) => (c.id === column.id ? { ...c, tasks: reordered } : c)));

    moveTask(draggedId, column.id, toIndex);
  }

  function handleCopyId() {
    navigator.clipboard.writeText(boardId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="board-page">
      <header className="board-header">
        <button className="board-back" onClick={() => navigate("/")} aria-label="Back home">
          &larr;
        </button>

        <div className="board-heading">
          <h1>{board.name}</h1>
          <button className="board-id" onClick={handleCopyId} title="Copy board ID to invite others">
            {copied ? "Copied!" : `ID: ${boardId}`}
          </button>
        </div>

        <div className="board-status-chip">
          <span className={`status-dot status-${connection}`} aria-hidden="true" />
          {connection === "online" ? `Live — ${userName}` : connection === "connecting" ? "Connecting…" : "Offline"}
        </div>
      </header>

      {notice && <div className="board-notice">{notice}</div>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="board-lanes">
          {columns.map((column) => (
            <ColumnLane
              key={column.id}
              column={column}
              onAddTask={(columnId, title) => createTask(columnId, title)}
              onEditTask={setEditingTask}
              onDeleteTask={deleteTask}
            />
          ))}
        </div>

        <DragOverlay>{activeTask && <TaskCardOverlay task={activeTask} />}</DragOverlay>
      </DndContext>

      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(taskId, title, description) => {
            updateTask(taskId, title, description);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
