import { Router } from "express";
import multer from "multer";
import { processAudio } from "../controllers/audio.controller.js";

const router = Router();
const upload = multer();

router.post("/voice-command", upload.single("audio"), processAudio);

export default router;
