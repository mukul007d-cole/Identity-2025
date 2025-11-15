import axios from "axios";

export const captureImageFromESP32 = async () => {
  try {
    const url = process.env.ESP32_URL;
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 5000
    });

    return Buffer.from(response.data);
  } catch (err) {
    console.error("ESP32 Capture Error:", err.message);
    throw new Error("Failed to capture image from ESP32");
  }
};