import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "../lib/socket";
import { getBoard } from "../lib/api";
import type { Board } from "../types";

type ConnectionState = "connecting" | "online" | "offline";

export function useBoardSocket(boardId: string, userName: string, initialBoard: Board) {
  const [board, setBoard] = useState(initialBoard);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3200);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    function refresh() {
      getBoard(boardId)
        .then(setBoard)
        .catch(() => showNotice("Couldn't sync the board — check your connection"));
    }

    function onConnect() {
      setConnection("online");
      socket.emit("join-board", { boardId, userName });
    }

    function onDisconnect() {
      setConnection("offline");
    }

    function onUserJoined({ userName: joinedName }: { userName: string }) {
      showNotice(`${joinedName} joined the board`);
    }

    function onSocketError({ message }: { message: string }) {
      showNotice(message);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("user-joined", onUserJoined);
    socket.on("task:created", refresh);
    socket.on("task:updated", refresh);
    socket.on("task:deleted", refresh);
    socket.on("task:moved", refresh);
    socket.on("error", onSocketError);

    socket.connect();
    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("user-joined", onUserJoined);
      socket.off("task:created", refresh);
      socket.off("task:updated", refresh);
      socket.off("task:deleted", refresh);
      socket.off("task:moved", refresh);
      socket.off("error", onSocketError);
      socket.disconnect();
    };
  }, [boardId, userName, showNotice]);

  const createTask = useCallback(
    (columnId: string, title: string, description?: string) => {
      getSocket().emit("task:create", { columnId, title, description });
    },
    []
  );

  const updateTask = useCallback(
    (taskId: string, title?: string, description?: string) => {
      getSocket().emit("task:update", { taskId, title, description });
    },
    []
  );

  const deleteTask = useCallback((taskId: string) => {
    getSocket().emit("task:delete", { taskId });
  }, []);

  const moveTask = useCallback(
    (taskId: string, targetColumnId: string, targetPosition: number) => {
      getSocket().emit("task:move", { taskId, targetColumnId, targetPosition });
    },
    []
  );

  return { board, connection, notice, createTask, updateTask, deleteTask, moveTask };
}
