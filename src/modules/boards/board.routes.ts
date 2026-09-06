import { Router } from "express";

import { createBoardController, getBoardController } from "./board.controller.js";

const router = Router();

router.post("/", createBoardController);
router.get("/:id", getBoardController);

export default router;