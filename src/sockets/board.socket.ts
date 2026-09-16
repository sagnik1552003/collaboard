import { Server, Socket } from "socket.io";
import prisma from "../lib/prisma.js";
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask
} from "../modules/tasks/task.service.js";

interface JoinBoardPayload {
  boardId: string;
  userName: string;
}

interface CreateTaskPayload {
  columnId: string;
  title: string;
  description?: string;
}

interface UpdateTaskPayload {
  taskId: string;
  title?: string;
  description?: string;
}

interface MoveTaskPayload {
  taskId: string;
  targetColumnId: string;
  targetPosition: number;
}

export function registerBoardSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on(
      "join-board",
      async ({ boardId, userName }: JoinBoardPayload) => {
        try {
          // Check that the board actually exists
          const board = await prisma.board.findUnique({
            where: {
              id: boardId,
            },
          });

          if (!board) {
            socket.emit("error", {
              message: "Board not found",
            });

            return;
          }

          // Join the Socket.IO room
          socket.join(`board:${boardId}`);

          // Store useful information on the socket
          socket.data.boardId = boardId;
          socket.data.userName = userName;

          console.log(`${userName} joined board ${boardId}`);

          // Tell the user that joining succeeded
          socket.emit("board-joined", {
            boardId,
            userName,
          });

          // Tell everyone ELSE in the board
          socket.to(`board:${boardId}`).emit("user-joined", {
            socketId: socket.id,
            userName,
          });
        } catch (error) {
          console.error(error);

          socket.emit("error", {
            message: "Failed to join board",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on(
  "task:create",
  async ({ columnId, title, description }: CreateTaskPayload) => {
    try {
      const boardId = socket.data.boardId;

      if (!boardId) {
        socket.emit("error", {
          message: "You must join a board first",
        });

        return;
      }

      const column = await prisma.column.findUnique({
        where: {
          id: columnId,
        },
        select: {
          boardId: true,
        },
      });

      if (!column) {
        socket.emit("error", {
          message: "Column not found",
        });

        return;
      }

      if (column.boardId !== boardId) {
        socket.emit("error", {
          message: "Column does not belong to this board",
        });

        return;
      }

      const task = await createTask(
        columnId,
        title,
        description
      );

      io.to(`board:${boardId}`).emit("task:created", {
        task,
      });
    } catch (error) {
      console.error(error);

      socket.emit("error", {
        message: "Failed to create task",
      });
    }
  }
);


socket.on(
  "task:update",
  async ({
    taskId,
    title,
    description,
  }: UpdateTaskPayload) => {
    try {
      const boardId = socket.data.boardId;

      if (!boardId) {
        socket.emit("error", {
          message: "You must join a board first",
        });

        return;
      }

      const task = await prisma.task.findUnique({
        where: {
          id: taskId,
        },
        include: {
          column: {
            select: {
              boardId: true,
            },
          },
        },
      });

      if (!task) {
        socket.emit("error", {
          message: "Task not found",
        });

        return;
      }

      if (task.column.boardId !== boardId) {
        socket.emit("error", {
          message: "Task does not belong to this board",
        });

        return;
      }

      const updatedTask = await updateTask(
        taskId,
        title,
        description
      );

      io.to(`board:${boardId}`).emit(
        "task:updated",
        {
          task: updatedTask,
        }
      );
    } catch (error) {
      console.error(error);

      socket.emit("error", {
        message: "Failed to update task",
      });
    }
  }
);

socket.on(
  "task:delete",
  async ({ taskId }: { taskId: string }) => {
    try {
      const boardId = socket.data.boardId;

      if (!boardId) {
        socket.emit("error", {
          message: "You must join a board first",
        });

        return;
      }

      const task = await prisma.task.findUnique({
        where: {
          id: taskId,
        },
        include: {
          column: {
            select: {
              boardId: true,
            },
          },
        },
      });

      if (!task) {
        socket.emit("error", {
          message: "Task not found",
        });

        return;
      }

      if (task.column.boardId !== boardId) {
        socket.emit("error", {
          message: "Task does not belong to this board",
        });

        return;
      }

      await deleteTask(taskId);

      io.to(`board:${boardId}`).emit(
        "task:deleted",
        {
          taskId,
        }
      );
    } catch (error) {
      console.error(error);

      socket.emit("error", {
        message: "Failed to delete task",
      });
    }
  }
);

socket.on(
  "task:move",
  async ({
    taskId,
    targetColumnId,
    targetPosition,
  }: MoveTaskPayload) => {
    try {
      const boardId = socket.data.boardId;

      if (!boardId) {
        socket.emit("error", {
          message: "You must join a board first",
        });

        return;
      }

      if (!Number.isInteger(targetPosition) || targetPosition < 0) {
        socket.emit("error", {
          message: "Invalid target position",
        });

        return;
      }

      const task = await prisma.task.findUnique({
        where: {
          id: taskId,
        },
        include: {
          column: {
            select: {
              boardId: true,
            },
          },
        },
      });

      if (!task) {
        socket.emit("error", {
          message: "Task not found",
        });

        return;
      }

      if (task.column.boardId !== boardId) {
        socket.emit("error", {
          message: "Task does not belong to this board",
        });

        return;
      }

      const targetColumn = await prisma.column.findUnique({
        where: {
          id: targetColumnId,
        },
        select: {
          boardId: true,
        },
      });

      if (!targetColumn) {
        socket.emit("error", {
          message: "Target column not found",
        });

        return;
      }

      if (targetColumn.boardId !== boardId) {
        socket.emit("error", {
          message: "Target column does not belong to this board",
        });

        return;
      }

      const movedTask = await moveTask(
        taskId,
        targetColumnId,
        targetPosition
      );

      io.to(`board:${boardId}`).emit(
        "task:moved",
        {
          task: movedTask,
        }
      );
    } catch (error) {
      console.error(error);

      socket.emit("error", {
        message: "Failed to move task",
      });
    }
  }
);
  });
}