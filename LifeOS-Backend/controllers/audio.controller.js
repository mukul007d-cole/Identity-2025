import { speechToText } from "../services/asr.service.js";
import { textToSpeech } from "../services/tts.service.js";
import InputLog from "../db/models/inputLog.model.js";
import { captureImageFromESP32 } from "../services/esp32.service.js";
import { analyzeImage } from "../services/vision.service.js";
import { askGemini } from "../services/textreply.service.js";
import { io } from "../server.js";
import { getIntent } from "../services/visionIntent.service.js";
import { addFace, recognizeFace } from "../services/face.service.js"; 

export const processAudio = async (req, res) => {
  let transcription, finalResponseText, visionRequired, visionResult, textReply;
  visionRequired = false;
  visionResult = null;
  textReply = null;
  
  try {
    // 1) Transcribe speech to text
    transcription = await speechToText(req.file.buffer);

    // 2) Log the transcription
    await InputLog.create({
      text: transcription,
      source: "pc-mic",
      type: "voice",
    });

    // 3) Get the user's INTENT
    const intentData = await getIntent(transcription);
    console.log("Intent:", intentData);

    let imageBuffer = null;

    // 4) Use a 'switch' to handle the intent
    switch (intentData.intent) {
      
      case "remember_face":
        visionRequired = true;
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
        
        console.log("Intent: Recognize face");
        imageBuffer = await captureImageFromESP32();
        const recognizedName = await recognizeFace(imageBuffer);
        
        if (recognizedName) {
          finalResponseText = `I recognize this person. This is ${recognizedName}.`;
        } else {
          finalResponseText = "I don't seem to recognize this person.";
        }
        break;

      case "general_vision":
        visionRequired = true;
        
        console.log("Intent: General vision query");
        imageBuffer = await captureImageFromESP32();
        visionResult = await analyzeImage(imageBuffer, transcription);
        finalResponseText = visionResult; // Speak the vision result
        
        // Also get a text reply for context
        textReply = await askGemini(transcription); 
        break;

      case "general_text":
      default:
        console.log("Intent: General text query");
        textReply = await askGemini(transcription);
        finalResponseText = textReply; // Speak the text reply
        break;
    }

    // 5) Convert the FINAL response to audio
    const audioFilePath = await textToSpeech(finalResponseText);
    const audioUrl = `http://${req.hostname}:${process.env.PORT || 3000}/${audioFilePath}`;

    // 6) Send data to clients via WebSocket
    io.emit("ai-response", {
      transcription: transcription,
      textReply,          // The "chat" reply (if any)
      finalResponseText,  // The text that was spoken
      audioFilePath,
      visionRequired,
      visionResult,       // The vision analysis (if any)
    });

    // 7) Send HTTP response
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
    // Send error response
    const errorMsg = "Sorry, I ran into an error.";
    const audioFilePath = await textToSpeech(errorMsg);
    const audioUrl = `http://${req.hostname}:${process.env.PORT || 3000}/${audioFilePath}`;
    
    res.status(500).json({ error: e.message, finalResponseText: errorMsg, audioUrl });
  }
};