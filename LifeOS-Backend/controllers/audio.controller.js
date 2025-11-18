import { speechToText } from "../services/asr.service.js";
import { textToSpeech } from "../services/tts.service.js";
import InputLog from "../db/models/inputLog.model.js";
import { captureImageFromESP32 } from "../services/esp32.service.js";
import { analyzeImage, compareFaces } from "../services/vision.service.js";
import { askGemini } from "../services/textreply.service.js";
import { io } from "../server.js";
import { getIntent } from "../services/visionIntent.service.js";
import { addFace, recognizeFace } from "../services/face.service.js";
import Note from "../db/models/note.model.js"; 

let conversationState = null;

export const processAudio = async (req, res) => {
  let transcription, finalResponseText, visionRequired, visionResult, textReply;
  visionRequired = false;
  visionResult = null;
  textReply = null;

  let logType = "voice"; // Default type
  let logMetadata = {};  // To store intent info or image data
  let imageBuffer = null; // To hold the raw image if captured

  try {
    // 1. Transcribe Audio
    transcription = await speechToText(req.file.buffer);

    // 2. Check Conversation State (Context)
    if (conversationState === "awaiting_note_content") {
      
      await Note.create({ content: transcription });
      
      finalResponseText = "Got it. Saved to your notes.";
      conversationState = null; 

      // LOGGING SETUP: This was a command completion
      logType = "command";
      logMetadata = { action: "create_note", content: transcription };

    } else {
      // 3. Normal Flow: Get Intent
      const intentData = await getIntent(transcription);
      console.log("Intent:", intentData);

      // Store intent in metadata
      logMetadata.intent = intentData.intent;
      logMetadata.payload = intentData.payload;

      // 4. Handle Intents
      switch (intentData.intent) {
        
        case "start_note":
          console.log("Intent: Start note session");
          conversationState = "awaiting_note_content"; 
          finalResponseText = "Okay, what's the note?";
          
          logType = "command";
          break;

        case "remember_face":
          visionRequired = true;
          logType = "image"; // Input involved vision

          const name = intentData.payload.name || "unknown";
          console.log(`Intent: Remember face for ${name}`);
          
          imageBuffer = await captureImageFromESP32();
          const newFace = await addFace(imageBuffer, name);
          
          if (newFace) {
            finalResponseText = `Okay, I'll remember this person as ${name}.`;
          } else {
            finalResponseText = "Sorry, I had trouble saving that face.";
          }
          break;

        case "recognize_face":
          visionRequired = true;
          logType = "image";

          console.log("Intent: Recognize face");
          imageBuffer = await captureImageFromESP32();
          const recognizedName = await recognizeFace(imageBuffer);
          
          if (recognizedName) {
            finalResponseText = `I recognize this person. This is ${recognizedName}.`;
            logMetadata.recognizedPerson = recognizedName;
          } else {
            finalResponseText = "I don't seem to recognize this person.";
            logMetadata.recognizedPerson = "unknown";
          }
          break;

        case "general_vision":
          visionRequired = true;
          logType = "image";

          console.log("Intent: General vision query");
          imageBuffer = await captureImageFromESP32();
          visionResult = await analyzeImage(imageBuffer, transcription);
          
          finalResponseText = visionResult; 
          textReply = await askGemini(transcription); 
          
          logMetadata.analysisResult = visionResult;
          break;

        case "general_text":
        default:
          console.log("Intent: General text query");
          textReply = await askGemini(transcription);
          finalResponseText = textReply;
          
          logType = "voice";
          break;
      }
    }

    // 5. SAVE TO DATABASE
    // If we have an image buffer, convert to Base64 to store in metadata
    if (imageBuffer) {
      logMetadata.capturedImage = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    }

    await InputLog.create({
      text: transcription,
      source: "pc-mic", // Or dynamically change if you pass source in headers
      type: logType,    // "voice", "command", or "image"
      metadata: logMetadata
    });
    console.log(`Log saved. Type: ${logType}`);

    // 6. TTS Generation
    const audioFilePath = await textToSpeech(finalResponseText);
    const audioUrl = `http://${req.hostname}:${process.env.PORT || 3000}/${audioFilePath}`;

    // 7. WebSocket Emission
    io.emit("ai-response", {
      transcription: transcription,
      textReply,          
      finalResponseText,  
      audioFilePath,
      visionRequired,
      visionResult,
    });

    // 8. HTTP Response
    res.json({
      transcription: transcription,
      visionRequired,
      visionResult,
      textReply,
      finalResponseText,
      audioUrl,
    });

  } catch (e) {
    console.error("Audio Controller Error:", e);
    conversationState = null; 
    
    const errorMsg = "Sorry, I ran into an error.";

    try {
        const audioFilePath = await textToSpeech(errorMsg);
        const audioUrl = `http://${req.hostname}:${process.env.PORT || 3000}/${audioFilePath}`;
        res.status(500).json({ error: e.message, finalResponseText: errorMsg, audioUrl });
    } catch (ttsError) {
        res.status(500).json({ error: e.message, finalResponseText: errorMsg });
    }
  }
};