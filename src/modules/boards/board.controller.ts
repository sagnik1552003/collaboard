import { Request, Response } from "express";
import { z } from "zod";

import { createBoard, getBoard } from "./board.service.js";

const createBoardSchema = z.object({
  name: z
    .string()
    .min(1, "Board name is required")
    .max(100, "Board name is too long"),
});

export async function createBoardController(
  req: Request,
  res: Response
) {
  try {
    const { name } = createBoardSchema.parse(req.body);

    const board = await createBoard(name);

    res.status(201).json(board);
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

export async function getBoardController(
  req: Request,
  res: Response
) {
  try {
    const boardId = z.string().uuid().parse(req.params.id);

    const board = await getBoard(boardId);

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    return res.json(board);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid board ID",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}