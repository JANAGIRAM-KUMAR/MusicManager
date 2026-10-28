import mongoose from "mongoose";
import PlayHistory from "../models/PlayHistory.js";

const MAX_HISTORY_PER_USER = 300;

const recordPlay = async (req, res, next) => {
  try {
    const { songId } = req.body;
    if (!songId || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ success: false, message: "Valid songId is required" });
    }

    await PlayHistory.create({ userId: req.userId, songId });

    const overflow = await PlayHistory.find({ userId: req.userId })
      .sort({ playedAt: -1 })
      .skip(MAX_HISTORY_PER_USER)
      .select("_id");

    if (overflow.length > 0) {
      await PlayHistory.deleteMany({ _id: { $in: overflow.map((row) => row._id) } });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getRecentlyPlayed = async (req, res, next) => {
  try {
    const rows = await PlayHistory.aggregate([
      { $match: { userId: req.userId } },
      { $sort: { playedAt: -1 } },
      {
        $group: {
          _id: "$songId",
          playedAt: { $first: "$playedAt" },
        },
      },
      { $sort: { playedAt: -1 } },
      { $limit: 30 },
      {
        $lookup: {
          from: "songs",
          localField: "_id",
          foreignField: "_id",
          as: "song",
        },
      },
      { $unwind: "$song" },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$song", { lastPlayed: "$playedAt" }],
          },
        },
      },
    ]);

    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

export { recordPlay, getRecentlyPlayed };
