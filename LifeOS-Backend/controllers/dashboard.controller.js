import InputLog from "../db/models/inputlog.model.js";
import KnownFace from "../db/models/knownface.model.js";
import Note from "../db/models/note.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { date } = req.query;
    
    // Default to today if no date provided
    const queryDate = date ? new Date(date) : new Date();
    
    // Create start and end times for the selected day
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Run all database queries in parallel for speed
    const [
      voiceCount,
      imageCount,
      faceCount,
      noteCount,
      recentActivity
    ] = await Promise.all([
      // 1. Voice Interactions Count
      InputLog.countDocuments({
        type: "voice",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      
      // 2. Images Captured Count
      InputLog.countDocuments({
        type: "image", // Assuming 'image' is the type for captured photos
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),

      // 3. Faces Recognized Count
      KnownFace.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),

      // 4. Notes Created Count
      Note.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),

      // 5. Recent Activity (Last 5 logs of any type)
      InputLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.status(200).json({
      counts: {
        voiceInteractions: voiceCount,
        imagesCaptured: imageCount,
        facesRecognized: faceCount,
        notesCreated: noteCount,
      },
      recentActivity,
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};