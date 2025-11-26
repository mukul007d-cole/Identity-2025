import { askGemini } from "./textreply.service.js"; 


const INTENT_CLASSIFIER_PROMPT = `
You are an intent classifier for a LifeOS Glasses vision assistant.
Your job is to analyze the user's text and return a JSON object with the "intent" and a "payload" if necessary.

The possible intents are:
1. "remember_face": User wants to save a face. (e.g., "Remember this person as Bob", "This is Alice")
2. "recognize_face": User wants to identify a face. (e.g., "Do I know this person?", "Who is this?")
3. "general_vision": User is asking about what they see, but not a person. (e.g., "What is this?", "Read this sign")
4. "start_note": User wants to begin taking a note. (e.g., "Take a note", "Jot this down", "Remember this")
5. "general_text": User is asking a question that requires no vision. (e.g., "What's the weather?", "Who won the game?")

Rules:
- If the intent is "remember_face", extract the name into the payload. If no name is clear, set payload.name to "unknown".
- For all other intents, the payload can be null.
- For "start_note", the payload is null.

User text: "Remember this is my friend Alice"
{"intent": "remember_face", "payload": {"name": "Alice"}}

User text: "Who are you?"
{"intent": "general_text", "payload": null}

User text: "Do I know this person?"
{"intent": "recognize_face", "payload": null}

User text: "What is that building?"
{"intent": "general_vision", "payload": null}

User text: "This is Bob"
{"intent": "remember_face", "payload": {"name": "Bob"}}

User text: "Take a note"
{"intent": "start_note", "payload": null}

User text: "{{USER_TEXT_HERE}}"
`;

export const getIntent = async (text) => {
  const prompt = INTENT_CLASSIFIER_PROMPT.replace("{{USER_TEXT_HERE}}", text);
  
  const response = await askGemini(prompt, 0); 
  
  try {
   
    const jsonResponse = response.match(/\{.*\}/s)[0];
    const intentData = JSON.parse(jsonResponse);
    return intentData;
  } catch (e) {
    console.error("Failed to parse intent from LLM:", e);
    
    return { intent: "general_text", payload: null };
  }
};