import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "SyncBoard backend is running",
  });
});

export default router;