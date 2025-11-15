import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const needsVision = async (text) => {
  try {
    const prompt = `
You are a classifier. Your job is to analyze a user's voice command and determine if the assistant MUST see an image or camera input to answer.

Examples that NEED VISION:
- "What is this?" 
- "Read this to me"
- "Tell me what I'm looking at"
- "What color is this?"
- "Is this safe to eat?"

Examples that DO NOT NEED VISION:
- "Set a timer"
- "Play music"
- "Open my summary"

Respond ONLY with: 
"yes" → if camera vision is needed  
"no" → if camera is NOT needed

User message: "${text}"
`;

    const result = await model.generateContent(prompt);
    const output = result.response.text().trim().toLowerCase();

    return output.includes("yes"); // returns true if vision needed
  } catch (err) {
    console.error("Vision intent error:", err);
    return false; // default to no
  }
};
