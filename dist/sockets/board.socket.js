"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBoardSocket = registerBoardSocket;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const task_service_js_1 = require("../modules/tasks/task.service.js");
function registerBoardSocket(io) {
    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);
        socket.on("join-board", async ({ boardId, userName }) => {
            try {
                // Check that the board actually exists
                const board = await prisma_js_1.default.board.findUnique({
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
            }
            catch (error) {
                console.error(error);
                socket.emit("error", {
                    message: "Failed to join board",
                });
            }
        });
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
        socket.on("task:create", async ({ columnId, title, description }) => {
            try {
                const boardId = socket.data.boardId;
                if (!boardId) {
                    socket.emit("error", {
                        message: "You must join a board first",
                    });
                    return;
                }
                const column = await prisma_js_1.default.column.findUnique({
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
                const task = await (0, task_service_js_1.createTask)(columnId, title, description);
                io.to(`board:${boardId}`).emit("task:created", {
                    task,
                });
            }
            catch (error) {
                console.error(error);
                socket.emit("error", {
                    message: "Failed to create task",
                });
            }
        });
        socket.on("task:update", async ({ taskId, title, description, }) => {
            try {
                const boardId = socket.data.boardId;
                if (!boardId) {
                    socket.emit("error", {
                        message: "You must join a board first",
                    });
                    return;
                }
                const task = await prisma_js_1.default.task.findUnique({
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
                const updatedTask = await (0, task_service_js_1.updateTask)(taskId, title, description);
                io.to(`board:${boardId}`).emit("task:updated", {
                    task: updatedTask,
                });
            }
            catch (error) {
                console.error(error);
                socket.emit("error", {
                    message: "Failed to update task",
                });
            }
        });
        socket.on("task:delete", async ({ taskId }) => {
            try {
                const boardId = socket.data.boardId;
                if (!boardId) {
                    socket.emit("error", {
                        message: "You must join a board first",
                    });
                    return;
                }
                const task = await prisma_js_1.default.task.findUnique({
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
                await (0, task_service_js_1.deleteTask)(taskId);
                io.to(`board:${boardId}`).emit("task:deleted", {
                    taskId,
                });
            }
            catch (error) {
                console.error(error);
                socket.emit("error", {
                    message: "Failed to delete task",
                });
            }
        });
        socket.on("task:move", async ({ taskId, targetColumnId, targetPosition, }) => {
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
                const task = await prisma_js_1.default.task.findUnique({
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
                const targetColumn = await prisma_js_1.default.column.findUnique({
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
                const movedTask = await (0, task_service_js_1.moveTask)(taskId, targetColumnId, targetPosition);
                io.to(`board:${boardId}`).emit("task:moved", {
                    task: movedTask,
                });
            }
            catch (error) {
                console.error(error);
                socket.emit("error", {
                    message: "Failed to move task",
                });
            }
        });
    });
}
