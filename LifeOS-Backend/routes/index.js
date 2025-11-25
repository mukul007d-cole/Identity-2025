import { Router } from "express";
import audioRoutes from "./audio.routes.js";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import settingsRoutes from "./settings.routes.js";

const router = Router();

router.get("/stats", getDashboardStats);
router.use("/audio", audioRoutes);
router.use("/settings", settingsRoutes);


export default router;