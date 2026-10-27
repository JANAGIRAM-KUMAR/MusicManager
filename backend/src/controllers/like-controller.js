import Like from "../models/Like.js";
import Song from "../models/Song.js";

const songProjection = "title artist imageUrl songUrl duration albumId createdAt updatedAt";

const getLikedSongs = async (req, res, next) => {
  try {
    const likes = await Like.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("songId", songProjection);

    const songs = likes.filter((like) => like.songId).map((like) => like.songId);
    res.status(200).json(songs);
  } catch (error) {
    next(error);
  }
};

const getLikedSongIds = async (req, res, next) => {
  try {
    const likes = await Like.find({ userId: req.userId }).select("songId");
    res.status(200).json(likes.map((like) => like.songId.toString()));
  } catch (error) {
    next(error);
  }
};

const toggleLike = async (req, res, next) => {
  try {
    const { songId } = req.params;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    const existing = await Like.findOne({ userId: req.userId, songId });
    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ liked: false, songId });
    }

    await Like.create({ userId: req.userId, songId });
    res.status(200).json({ liked: true, songId });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(200).json({ liked: true, songId: req.params.songId });
    }
    next(error);
  }
};

export { getLikedSongs, getLikedSongIds, toggleLike };
