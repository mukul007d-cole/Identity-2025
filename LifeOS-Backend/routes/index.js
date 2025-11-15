import { Router } from "express";
import audioRoutes from "./audio.routes.js";

const router = Router();


router.use("/audio", audioRoutes);


export default router;