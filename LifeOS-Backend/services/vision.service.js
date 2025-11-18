export const analyzeImage = async (imageBuffer, userText) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash-latest"; 

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
    // Handle cases where the model might not return text (e.g., safety)
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
    const model = "gemini-1.5-flash-latest"; // Using a modern vision model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = "You are a face comparison expert. Look at the two images provided. Are they of the same person? Please answer with only the word 'yes' or 'no'.";

    // 1. Convert both images to base64
    const image1Base64 = image1.toString("base64");
    const image2Base64 = image2.toString("base64");

    // 2. Build the REST API request body
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
      // Add generationConfig to get a strict, predictable "yes/no"
      generationConfig: {
        maxOutputTokens: 5,
        temperature: 0.0,
      },
    };

    // 3. Make the fetch request
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

    // 4. Extract and return the boolean
    const text = data.candidates[0].content.parts[0].text.trim().toLowerCase();
    return text.includes("yes");

  } catch (err) {
    console.error("Gemini Face Compare Error:", err.message);
    return false; // Default to "not a match" on any error
  }
};