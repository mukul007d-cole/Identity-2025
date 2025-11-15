import { speechToText } from "../services/asr.service.js";
import InputLog from "../models/inputLog.model.js";
import { needsVision } from "../services/visionIntent.service.js";
import { captureImageFromESP32 } from "../services/esp32.service.js";
import { analyzeImage } from "../services/vision.service.js";

export const processAudio = async (req, res) => {
  try {
    const text = await speechToText(req.file.buffer);
    await InputLog.create({
        text,
        source: "pc-mic",
        type: "voice",
      });

    const visionRequired = await needsVision(text);
    let visionResult = null;

    if (visionRequired) {
      const imageBuffer = await captureImageFromESP32();
      visionResult = await analyzeImage(imageBuffer, text);
    }
    res.json({
      transcription: text,
      visionRequired,
      visionResult
    });

  } catch (e) {
    res.status(500).json({ error: "Audio transcription failed" });
  }
};

