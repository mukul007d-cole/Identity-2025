import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

export async function textToSpeech(text) {
  // Ensure output folder exists
  await fs.mkdir(path.join(process.cwd(), "public", "audio"), { recursive: true });

  const url = "https://api.openai.com/v1/audio/speech";

  const payload = {
    model: "tts-1",
    voice: "alloy",
    // MP3 is universally supported by all browsers, including mobile.
    response_format: "mp3", 
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

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Update the file extension to match the response_format
  const fileName = `reply_${Date.now()}.mp3`;
  
  // Use a reliable path relative to the project root
  const audioPath = path.join(process.cwd(), "public", "audio", fileName);
  
  await fs.writeFile(audioPath, buffer);

  // Return the correct file path relative to the 'public' folder
  // e.g., "audio/reply_12345.mp3"
  return path.join("audio", fileName).replace(/\\/g, "/");
}