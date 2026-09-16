import prisma from "../../lib/prisma.js";

export async function createTask(
  columnId: string,
  title: string,
  description?: string
) {
  // Find the current last position
  const lastTask = await prisma.task.findFirst({
    where: {
      columnId,
    },
    orderBy: {
      position: "desc",
    },
  });

  const position = lastTask ? lastTask.position + 1 : 0;

  return prisma.task.create({
    data: {
      title,
      description,
      columnId,
      position,
    },
  });
}

export async function updateTask(
  taskId: string,
  title?: string,
  description?: string
) {
  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    },
  });
}

export async function deleteTask(taskId: string) {
  return prisma.task.delete({
    where: {
      id: taskId,
    },
  });
}

export async function moveTask(
  taskId: string,
  targetColumnId: string,
  targetPosition: number
) {
  return prisma.$transaction(async (tx) => {
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
      } else if (targetPosition < task.position) {
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