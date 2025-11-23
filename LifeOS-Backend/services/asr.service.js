import fs from "fs";
import path from "path";
import os from "os";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert mic recording (Chrome/Safari) to text reliably
 * Supports:
 *  webm, wav, mp4, m4a, ogg, mp3
 */
export const speechToText = async (audioBuffer, mimeType) => {
  let tempFilePath = null;

  try {
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Empty audio buffer");
    }

    // Normalize extension
    // Example: "audio/webm" -> "webm"
    const ext = mimeType?.split("/")?.[1]?.toLowerCase() || "webm";

    // Some browsers return "webm;codecs=opus"
    const cleanExt = ext.split(";")[0];

    const fileName = `voice_${Date.now()}.${cleanExt}`;
    tempFilePath = path.join(os.tmpdir(), fileName);

    // Save buffer to disk
    fs.writeFileSync(tempFilePath, audioBuffer);

    // 🔥 USE THE NEW SPEECH API
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      // NEW: This model accepts webm from Chrome
      model: "gpt-4o-mini-transcribe", 
      language: "en",   // Optional
      response_format: "text",
    });

    return response?.trim?.() || response;

  } catch (err) {
    console.error("SpeechToText Error:", err);
    throw new Error("Speech transcription failed.");
  } finally {
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch {}
  }
};
