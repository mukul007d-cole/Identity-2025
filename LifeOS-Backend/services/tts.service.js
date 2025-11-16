import { promises as fs } from "fs"; // Use async fs for file writing
import path from "path";
import dotenv from "dotenv";
dotenv.config();

export async function textToSpeech(text) {
  // Ensure output folder exists (using async/await)
  await fs.mkdir(path.join(process.cwd(), "public", "audio"), { recursive: true });

  const url = "https://api.openai.com/v1/audio/speech";

  const payload = {
    model: "tts-1",           // 1. FIXED: Use a valid TTS model (e.g., "tts-1")
    voice: "alloy",
    response_format: "wav",   // 2. FIXED: Parameter name is "response_format"
    input: text
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new Error("TTS request failed.");
  }

  // 3. FIXED: Get the response as an ArrayBuffer (raw binary data)
  const arrayBuffer = await response.arrayBuffer();
  
  // 4. FIXED: Convert the ArrayBuffer directly to a Buffer
  const buffer = Buffer.from(arrayBuffer);

  // Save file
  const fileName = `reply_${Date.now()}.wav`;
  // Use a reliable path relative to the project root
  const audioPath = path.join(process.cwd(), "public", "audio", fileName);

  await fs.writeFile(audioPath, buffer); // Use async writeFile

  return fileName;
}