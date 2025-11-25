import { Router } from "express";
import { getSystemStats, clearAllData } from "../controllers/settings.controller.js";

const router = Router();

router.get("/stats", getSystemStats);
router.delete("/reset", clearAllData);

export default router;