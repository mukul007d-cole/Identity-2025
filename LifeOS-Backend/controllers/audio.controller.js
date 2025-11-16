import { speechToText } from "../services/asr.service.js";
import { textToSpeech } from "../services/tts.service.js";
import InputLog from "../db/models/inputLog.model.js";
import { needsVision } from "../services/visionIntent.service.js";
import { captureImageFromESP32 } from "../services/esp32.service.js";
import { analyzeImage } from "../services/vision.service.js";
import { askGemini } from "../services/textreply.service.js";
import { io } from "../server.js";

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

    // 4) Capture + analyze image if needed
    if (visionRequired) {
      const imageBuffer = await captureImageFromESP32();
      visionResult = await analyzeImage(imageBuffer, text);
    }

    // 5) ALWAYS ask Gemini for a normal text reply
    const textReply = await askGemini(text);

    // 6) Decide what we will speak out loud
    // If vision was requested → speak the vision result
    // But keep Gemini normal reply SEPARATELY
    const finalResponseText = visionRequired && visionResult
      ? visionResult
      : textReply;

    // 7) Convert finalResponseText → audio
    const audioFilePath = await textToSpeech(finalResponseText);

    // 8) Build audio URL for Android
    const audioUrl = `http://${req.hostname}:${process.env.PORT || 3000}/${audioFilePath}`;

    // 9) Send data to Android via WebSocket
    io.emit("ai-response", {
      transcription: text,
      textReply,         // NEW
      finalResponseText, // spoken version
      audioUrl,
      visionRequired,
      visionResult
    });
    

    // 10) Send HTTP response
    res.json({
      transcription: text,
      visionRequired,
      visionResult,
      textReply,
      finalResponseText,
      audioUrl,
    });

  } catch (e) {
    console.error("Audio Controller Error:", e);
    res.status(500).json({ error: "Audio processing failed" });
  }
};
