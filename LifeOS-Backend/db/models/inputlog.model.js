import mongoose from "mongoose";

const inputLogSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },

  source: {
    type: String,
    enum: ["pc-mic", "glasses-camera", "glasses-mic", "system"],
    default: "pc-mic",
  },

  type: {
    type: String,
    enum: ["voice", "image", "command", "system"],
    default: "voice",
  },

  metadata: {
    type: Object,
    default: {},
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});
const InputLog = mongoose.models.InputLog || mongoose.model("InputLog", inputLogSchema);

export default InputLog;
