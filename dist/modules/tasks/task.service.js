"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.moveTask = moveTask;
const prisma_js_1 = __importDefault(require("../../lib/prisma.js"));
async function createTask(columnId, title, description) {
    // Find the current last position
    const lastTask = await prisma_js_1.default.task.findFirst({
        where: {
            columnId,
        },
        orderBy: {
            position: "desc",
        },
    });
    const position = lastTask ? lastTask.position + 1 : 0;
    return prisma_js_1.default.task.create({
        data: {
            title,
            description,
            columnId,
            position,
        },
    });
}
async function updateTask(taskId, title, description) {
    return prisma_js_1.default.task.update({
        where: {
            id: taskId,
        },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
        },
    });
}
async function deleteTask(taskId) {
    return prisma_js_1.default.task.delete({
        where: {
            id: taskId,
        },
    });
}
async function moveTask(taskId, targetColumnId, targetPosition) {
    return prisma_js_1.default.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
            where: {
                id: taskId,
            },
        });
        if (!task) {
            throw new Error("Task not found");
        }
        const targetColumn = await tx.column.findUnique({
            where: {
                id: targetColumnId,
            },
            select: {
                id: true,
            },
        });
        if (!targetColumn) {
            throw new Error("Target column not found");
        }
        const oldColumnId = task.columnId;
        // Moving within the same column
        if (oldColumnId === targetColumnId) {
            if (targetPosition > task.position) {
                await tx.task.updateMany({
                    where: {
                        columnId: oldColumnId,
                        position: {
                            gt: task.position,
                            lte: targetPosition,
                        },
                    },
                    data: {
                        position: {
                            decrement: 1,
                        },
                    },
                });
            }
            else if (targetPosition < task.position) {
                await tx.task.updateMany({
                    where: {
                        columnId: oldColumnId,
                        position: {
                            gte: targetPosition,
                            lt: task.position,
                        },
                    },
                    data: {
                        position: {
                            increment: 1,
                        },
                    },
                });
            }
            return tx.task.update({
                where: {
                    id: taskId,
                },
                data: {
                    position: targetPosition,
                },
            });
        }
        // Remove task from old column
        await tx.task.updateMany({
            where: {
                columnId: oldColumnId,
                position: {
                    gt: task.position,
                },
            },
            data: {
                position: {
                    decrement: 1,
                },
            },
        });
        // Make room in target column
        await tx.task.updateMany({
            where: {
                columnId: targetColumnId,
                position: {
                    gte: targetPosition,
                },
            },
            data: {
                position: {
                    increment: 1,
                },
            },
        });
        // Move task
        return tx.task.update({
            where: {
                id: taskId,
            },
            data: {
                columnId: targetColumnId,
                position: targetPosition,
            },
        });
    });
}
