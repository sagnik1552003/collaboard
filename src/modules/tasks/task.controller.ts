import { Request, Response } from "express";
import { z } from "zod";

import {
  createTask,
  updateTask, deleteTask,
} from "./task.service.js";

const createTaskSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

export async function createTaskController(
  req: Request,
  res: Response
) {
  try {
    const { columnId, title, description } =
      createTaskSchema.parse(req.body);

    const task = await createTask(
      columnId,
      title,
      description
    );

    return res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function updateTaskController(
  req: Request,
  res: Response
) {
  try {
    const taskId = z.string().uuid().parse(req.params.id);

    const { title, description } =
      updateTaskSchema.parse(req.body);

    const task = await updateTask(
      taskId,
      title,
      description
    );

    return res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function deleteTaskController(
  req: Request,
  res: Response
) {
  try {
    const taskId = z.string().uuid().parse(req.params.id);

    await deleteTask(taskId);

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}