import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const analyzeImage = async (imageBuffer, userText) => {
  try {
    const prompt = `
User said: "${userText}"
Use the image to answer the user's request.
Keep the answer short, helpful, clear.
`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBuffer.toString("base64"),
        },
      },
      { text: prompt }
    ]);

    return result.response.text();
  } catch (err) {
    console.error("Gemini Vision Error:", err.message);
    throw new Error("Image analysis failed");
  }
};