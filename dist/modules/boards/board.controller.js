"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoardController = createBoardController;
exports.getBoardController = getBoardController;
const zod_1 = require("zod");
const board_service_js_1 = require("./board.service.js");
const createBoardSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "Board name is required")
        .max(100, "Board name is too long"),
});
async function createBoardController(req, res) {
    try {
        const { name } = createBoardSchema.parse(req.body);
        const board = await (0, board_service_js_1.createBoard)(name);
        res.status(201).json(board);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
async function getBoardController(req, res) {
    try {
        const boardId = zod_1.z.string().uuid().parse(req.params.id);
        const board = await (0, board_service_js_1.getBoard)(boardId);
        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }
        return res.json(board);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
