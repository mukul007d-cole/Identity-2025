import express from "express";
import multer from "multer"; // npm install multer
import { processAudio } from "../controllers/audio.controller.js";

const router = express.Router();

// CRITICAL: Use memoryStorage so 'req.file.buffer' is available
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// The field name 'audio' matches the frontend: form.append("audio", ...)
router.post("/voice-command", upload.single("audio"), processAudio);

export default router;