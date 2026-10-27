import mongoose from "mongoose";

const playHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
    playedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

const PlayHistory = mongoose.model("PlayHistory", playHistorySchema);
export default PlayHistory;
