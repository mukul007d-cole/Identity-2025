export const needsVision = async (text) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // ✅ USE A VALID MODEL NAME
    const model = "gemini-2.0-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `
You are a classifier. Your job is to analyze a user's voice command and determine if the assistant MUST see an image or camera input to answer.

Examples that NEED VISION:
- "What is this?"
- "Read this to me"
- "Tell me what I'm looking at"
- "What color is this?"
- "Is this safe to eat?"
- "Describe what I'm holding"
- "What does this say?"

Examples that DO NOT NEED VISION:
- "Set a timer"
- "Remind me at 5"
- "Open my summary"
- "Tell me a joke"
- "Play music"

Respond ONLY with: 
"yes" → if camera vision is needed  
"no" → if camera is NOT needed

User message: "${text}"
`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    const output = data.candidates[0].content.parts[0].text
      .trim()
      .toLowerCase();

    return output.includes("yes");

  } catch (err) {
    console.error("Vision intent error:", err.message);
    return false; // fallback
  }
};
