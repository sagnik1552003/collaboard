"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const task_routes_js_1 = __importDefault(require("./modules/tasks/task.routes.js"));
const health_routes_js_1 = __importDefault(require("./routes/health.routes.js"));
const board_routes_js_1 = __importDefault(require("./modules/boards/board.routes.js"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/health", health_routes_js_1.default);
app.use("/api/boards", board_routes_js_1.default);
app.use("/api/tasks", task_routes_js_1.default);
exports.default = app;
