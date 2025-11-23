
export async function askGemini(text) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const model = "gemini-2.0-flash";

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
      const requestBody = {
        systemInstruction: {
          parts: [
            { text: "You are LifeOS AI assistant a smart glass. Reply concisely and be helpful." }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [{ text }]
          }
        ]
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

      return data.candidates[0].content.parts[0].text;
  
    } catch (err) {
      console.error("Gemini Error:", err.message);
      return "Sorry, I couldn't understand that.";
    }
  }