import express from "express";
import cors from "cors";
import taskRouter from "./modules/tasks/task.routes.js";
import healthRouter from "./routes/health.routes.js";
import boardRouter from "./modules/boards/board.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/boards", boardRouter);
app.use("/api/tasks", taskRouter);

export default app;