import InputLog from "../db/models/inputlog.model.js";
import KnownFace from "../db/models/knownface.model.js";
import Note from "../db/models/note.model.js";

// GET /api/settings/stats
export const getSystemStats = async (req, res) => {
  try {
    const [imageCount, voiceCount, faceCount, noteCount] = await Promise.all([
      InputLog.countDocuments({ type: "image" }),
      InputLog.countDocuments({ type: "voice" }),
      KnownFace.countDocuments({}),
      Note.countDocuments({}),
    ]);

    res.json({
      images: imageCount,
      voice: voiceCount,
      faces: faceCount,
      notes: noteCount,
    });
  } catch (error) {
    console.error("Settings Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// DELETE /api/settings/reset
export const clearAllData = async (req, res) => {
  try {
    // Delete all data from all collections
    await Promise.all([
      InputLog.deleteMany({}),
      KnownFace.deleteMany({}),
      Note.deleteMany({}),
    ]);

    res.json({ message: "System reset successful" });
  } catch (error) {
    console.error("Reset Error:", error);
    res.status(500).json({ error: "Failed to reset system" });
  }
};