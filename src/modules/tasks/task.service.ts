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