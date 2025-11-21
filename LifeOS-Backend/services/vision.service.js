export const analyzeImage = async (imageBuffer, userText) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-2.0-flash"; 

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `
User said: "${userText}"
Use the image to answer the user's request.
Keep the answer short, helpful, clear.
`;

    const imageBase64 = imageBuffer.toString("base64");

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    };

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

    if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error("Invalid response structure from Gemini API");
    }
    return data.candidates[0].content.parts[0].text;

  } catch (err) {
    console.error("Gemini Vision Error:", err.message);
    throw new Error("Image analysis failed");
  }
};

/**
 * Compares two images to see if they are the same person.
 * Uses the same fetch/REST API style as analyzeImage.
 * @param {Buffer} image1 - The new image captured.
 * @param {Buffer} image2 - A saved image from the database.
 * @returns {boolean} - True if it's a match.
 */
export const compareFaces = async (image1, image2) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = "You are a face comparison expert. Look at the two images provided. Are they of the same person? Please answer with only the word 'yes' or 'no'.";

    const image1Base64 = image1.toString("base64");
    const image2Base64 = image2.toString("base64");

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt }, 
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image1Base64,
              },
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image2Base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 5,
        temperature: 0.0,
      },
    };

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

    const text = data.candidates[0].content.parts[0].text.trim().toLowerCase();
    return text.includes("yes");

  } catch (err) {
    console.error("Gemini Face Compare Error:", err.message);
    return false; 
  }
};