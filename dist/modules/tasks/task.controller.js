"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskController = createTaskController;
exports.updateTaskController = updateTaskController;
exports.deleteTaskController = deleteTaskController;
const zod_1 = require("zod");
const task_service_js_1 = require("./task.service.js");
const createTaskSchema = zod_1.z.object({
    columnId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
});
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().optional(),
});
async function createTaskController(req, res) {
    try {
        const { columnId, title, description } = createTaskSchema.parse(req.body);
        const task = await (0, task_service_js_1.createTask)(columnId, title, description);
        return res.status(201).json(task);
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
async function updateTaskController(req, res) {
    try {
        const taskId = zod_1.z.string().uuid().parse(req.params.id);
        const { title, description } = updateTaskSchema.parse(req.body);
        const task = await (0, task_service_js_1.updateTask)(taskId, title, description);
        return res.json(task);
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
async function deleteTaskController(req, res) {
    try {
        const taskId = zod_1.z.string().uuid().parse(req.params.id);
        await (0, task_service_js_1.deleteTask)(taskId);
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
