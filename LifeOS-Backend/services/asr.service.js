import axios from "axios";
import FormData from "form-data";

export const speechToText = async (audioBuffer) => {
  try {
    const formData = new FormData();
    formData.append("file", audioBuffer, "audio.webm");
    formData.append("model", "whisper-1");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.text;
  } catch (error) {
    console.error("Whisper error:", error.response?.data || error.message);
    throw new Error("Transcription failed");
  }
};
