import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

likeSchema.index({ userId: 1, songId: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);
export default Like;
