import mongoose from "mongoose";

const knownFaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const KnownFace = mongoose.model("KnownFace", knownFaceSchema);

export default KnownFace;