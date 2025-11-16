// No Google library import needed

export const analyzeImage = async (imageBuffer, userText) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // ✅ CORRECT
    const model = "gemini-2.0-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // 1. Build the prompt text
    const prompt = `
User said: "${userText}"
Use the image to answer the user's request.
Keep the answer short, helpful, clear.
`;

    // 2. Convert the image buffer to base64
    const imageBase64 = imageBuffer.toString("base64");

    // 3. Build the REST API request body
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              // The first part is the image
              inlineData: {
                mimeType: "image/jpeg", // Make sure this matches your image type
                data: imageBase64,
              },
            },
            {
              // The second part is the text prompt
              text: prompt,
            },
          ],
        },
      ],
    };

    // 4. Make the fetch request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 5. Extract and return the text response
    return data.candidates[0].content.parts[0].text;

  } catch (err) {
    console.error("Gemini Vision Error:", err.message);
    throw new Error("Image analysis failed");
  }
};