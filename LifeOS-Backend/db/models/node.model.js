import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  source: {
    type: String,
    default: "voice-logger",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Note = mongoose.model("Note", noteSchema);

export default Note;