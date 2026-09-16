"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_js_1 = require("./task.controller.js");
const router = (0, express_1.Router)();
router.post("/", task_controller_js_1.createTaskController);
router.patch("/:id", task_controller_js_1.updateTaskController);
router.delete("/:id", task_controller_js_1.deleteTaskController);
exports.default = router;
