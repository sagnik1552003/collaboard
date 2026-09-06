import { Router } from "express";

import {
  createTaskController,
  deleteTaskController,
  updateTaskController,
} from "./task.controller.js";

const router = Router();

router.post("/", createTaskController);
router.patch("/:id", updateTaskController);
router.delete("/:id", deleteTaskController);

export default router;