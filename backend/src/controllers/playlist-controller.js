import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

const songProjection = "title artist imageUrl songUrl duration albumId createdAt updatedAt";

const findOwnedPlaylist = async (playlistId, userId) => {
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    const error = new Error("Playlist not found");
    error.status = 404;
    throw error;
  }
  if (playlist.ownerId !== userId) {
    const error = new Error("You do not own this playlist");
    error.status = 403;
    throw error;
  }
  return playlist;
};

const getMyPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ ownerId: req.userId })
      .sort({ updatedAt: -1 })
      .populate("songs", songProjection);
    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};

const getPlaylistById = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.playlistId).populate(
      "songs",
      songProjection
    );

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    const isOwner = playlist.ownerId === req.userId;
    if (!isOwner && !playlist.isPublic) {
      return res.status(403).json({ success: false, message: "Playlist is private" });
    }

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

const createPlaylist = async (req, res, next) => {
  try {
    const { title, description = "", imageUrl = "", isPublic = false } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const playlist = await Playlist.create({
      title: title.trim(),
      description,
      imageUrl,
      isPublic,
      ownerId: req.userId,
      songs: [],
    });

    res.status(201).json(playlist);
  } catch (error) {
    next(error);
  }
};

const updatePlaylist = async (req, res, next) => {
  try {
    const playlist = await findOwnedPlaylist(req.params.playlistId, req.userId);
    const { title, description, imageUrl, isPublic } = req.body;

    if (typeof title === "string") playlist.title = title.trim() || playlist.title;
    if (typeof description === "string") playlist.description = description;
    if (typeof imageUrl === "string") playlist.imageUrl = imageUrl;
    if (typeof isPublic === "boolean") playlist.isPublic = isPublic;

    await playlist.save();
    await playlist.populate("songs", songProjection);

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

const deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await findOwnedPlaylist(req.params.playlistId, req.userId);
    await playlist.deleteOne();
    res.status(200).json({ success: true, message: "Playlist deleted" });
  } catch (error) {
    next(error);
  }
};

const addSongToPlaylist = async (req, res, next) => {
  try {
    const playlist = await findOwnedPlaylist(req.params.playlistId, req.userId);
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ success: false, message: "songId is required" });
    }

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    if (!playlist.songs.some((id) => id.toString() === songId)) {
      playlist.songs.push(song._id);
      if (!playlist.imageUrl) playlist.imageUrl = song.imageUrl;
      await playlist.save();
    }

    await playlist.populate("songs", songProjection);
    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

const removeSongFromPlaylist = async (req, res, next) => {
  try {
    const playlist = await findOwnedPlaylist(req.params.playlistId, req.userId);
    playlist.songs = playlist.songs.filter(
      (id) => id.toString() !== req.params.songId
    );
    await playlist.save();
    await playlist.populate("songs", songProjection);

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

const reorderPlaylist = async (req, res, next) => {
  try {
    const playlist = await findOwnedPlaylist(req.params.playlistId, req.userId);
    const { songIds } = req.body;

    if (!Array.isArray(songIds)) {
      return res.status(400).json({ success: false, message: "songIds is required" });
    }

    const current = playlist.songs.map((id) => id.toString());
    const sameLength = current.length === songIds.length;
    const sameSet = songIds.every((id) => current.includes(id));

    if (!sameLength || !sameSet) {
      return res.status(400).json({
        success: false,
        message: "songIds must contain exactly the playlist songs",
      });
    }

    playlist.songs = songIds;
    await playlist.save();
    await playlist.populate("songs", songProjection);

    res.status(200).json(playlist);
  } catch (error) {
    next(error);
  }
};

export {
  getMyPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylist,
};
