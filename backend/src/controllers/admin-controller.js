import Song from "../models/Song.js";
import Album from "../models/Album.js";
import Playlist from "../models/Playlist.js";
import Like from "../models/Like.js";
import cloudinary from '../lib/cloudinary.js';

// helper function to upload files to cloudinary
const uploadToCloudinary = async (filePath, folder) => {
  try {
    if (!filePath) {
      throw new Error("No file path provided to Cloudinary");
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    return result; // return FULL result
  } catch (error) {
    throw new Error("Cloudinary upload failed: " + error.message);
  }
};

const createSong = async (req, res, next) => {
  try {
    if (!req.files?.audioFile || !req.files?.imageFile) {
      return res.status(400).json({
        message: "Please upload both audio and image files",
      });
    }

    const { title, artist, albumId, albumIds, duration } = req.body;

    if (!title || !artist) {
      return res.status(400).json({
        message: "Title and artist are required",
      });
    }

    const audioFile = req.files.audioFile;
    const imageFile = req.files.imageFile;

    const audioUpload = await uploadToCloudinary(
      audioFile.tempFilePath,
      "songs/audio"
    );

    const imageUpload = await uploadToCloudinary(
      imageFile.tempFilePath,
      "songs/images"
    );

    const songDuration = duration ? Number(duration) : 0;
    
    let finalAlbumIds = [];
    if (albumIds) {
      if (Array.isArray(albumIds)) {
        finalAlbumIds = albumIds.filter(id => id && id !== "none");
      } else if (typeof albumIds === 'string') {
        try {
          const parsed = JSON.parse(albumIds);
          finalAlbumIds = Array.isArray(parsed) ? parsed.filter(id => id && id !== "none") : [];
        } catch {
          if (albumIds !== "none") finalAlbumIds = [albumIds];
        }
      }
    } else if (albumId && albumId !== "none") {
      finalAlbumIds = [albumId];
    }

    const song = await Song.create({
      title: title.trim(),
      artist: artist.trim(),
      albumId: finalAlbumIds.length > 0 ? finalAlbumIds[0] : null,
      albumIds: finalAlbumIds,
      duration: songDuration,
      songUrl: audioUpload.secure_url,
      imageUrl: imageUpload.secure_url,
    });

    // Add song to all selected albums
    for (const aid of finalAlbumIds) {
      await Album.findByIdAndUpdate(aid, {
        $addToSet: { songs: song._id },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Song created successfully",
      song,
    });
  } catch (error) {
    console.error("Error in create song controller:", error);
    next(error);
  }
};


const deleteSong = async (req, res, next) => {
    try {
        const {id} = req.params;
        const song = await Song.findById(id);

        if (!song) {
            return res.status(404).json({success: false, message: 'Song not found'});
        }

        //if the song is in album update the album's list
        if(song.albumId){
            await Album.findByIdAndUpdate(song.albumId, {$pull: {songs: song._id}});
        }
        await Playlist.updateMany({ songs: id }, { $pull: { songs: id } });
        await Like.deleteMany({ songId: id });
        await Song.findByIdAndDelete(id);
        return res.status(200).json({success: true, message: 'Song deleted successfully'}); 

    } catch (error) {
        console.log("Error in deleting song:", error);
        next(error);
    }
}

const updateSong = async (req, res, next) => {
    try {
        const {id} = req.params;
        const { title, artist, albumId, albumIds, duration } = req.body;
        
        const song = await Song.findById(id);
        if (!song) {
            return res.status(404).json({success: false, message: 'Song not found'});
        }
        
        const oldAlbumIds = song.albumIds || (song.albumId ? [song.albumId] : []);
        
        let newAlbumIds = [];
        if (albumIds) {
          if (Array.isArray(albumIds)) {
            newAlbumIds = albumIds.filter(id => id && id !== "none");
          } else if (typeof albumIds === 'string') {
            try {
              const parsed = JSON.parse(albumIds);
              newAlbumIds = Array.isArray(parsed) ? parsed.filter(id => id && id !== "none") : [];
            } catch {
              if (albumIds !== "none") newAlbumIds = [albumIds];
            }
          }
        } else if (albumId !== undefined) {
          newAlbumIds = albumId && albumId !== "none" ? [albumId] : [];
        } else {
          newAlbumIds = oldAlbumIds;
        }
        
        if (title) song.title = title.trim();
        if (artist) song.artist = artist.trim();
        if (duration !== undefined) song.duration = Number(duration);
        song.albumId = newAlbumIds.length > 0 ? newAlbumIds[0] : null;
        song.albumIds = newAlbumIds;
        
        await song.save();
        
        // Update album song lists
        const toRemove = oldAlbumIds.filter(old => !newAlbumIds.some(n => String(n) === String(old)));
        const toAdd = newAlbumIds.filter(n => !oldAlbumIds.some(old => String(old) === String(n)));
        
        for (const aid of toRemove) {
            await Album.findByIdAndUpdate(aid, {$pull: {songs: song._id}});
        }
        for (const aid of toAdd) {
            await Album.findByIdAndUpdate(aid, {$addToSet: {songs: song._id}});
        }
        
        return res.status(200).json({success: true, message: 'Song updated successfully', song});
    } catch (error) {
        console.log("Error in updating song:", error);
        next(error);
    }
}

const createAlbum = async (req, res, next) => {
  try {
    if (!req.files?.imageFile) {
      return res.status(400).json({ message: "Album image is required" });
    }

    const { title, artist, releaseDate } = req.body;

    if (!releaseDate) {
      return res.status(400).json({ message: "releaseDate is required" });
    }

    const imageFile = req.files.imageFile;

    console.log("IMAGE PATH:", imageFile.tempFilePath);

    const imageUpload = await uploadToCloudinary(
      imageFile.tempFilePath,
      "albums/images"
    );

    const album = await Album.create({
      title,
      artist,
      releaseDate,
      imageUrl: imageUpload.secure_url,
    });

    return res.status(201).json({
      success: true,
      message: "Album created successfully",
      album,
    });
  } catch (error) {
    console.log("Error in creating Album", error);
    next(error);
  }
};

const deleteAlbum = async (req, res, next) => {
    try {
        const {id} = req.params;
        const album = await Album.findById(id);
        if (!album) {
            return res.status(404).json({success: false, message: 'Album not found'});
        }
        // Remove this album from songs but don't delete the songs
        await Song.updateMany(
            { $or: [{ albumId: id }, { albumIds: id }] },
            { 
                $pull: { albumIds: id },
                $set: { albumId: null }
            }
        );
        // Reset albumId for songs that had this as their primary album
        const songsToFix = await Song.find({ albumId: id });
        for (const song of songsToFix) {
            const remaining = (song.albumIds || []).filter(aid => String(aid) !== String(id));
            song.albumId = remaining.length > 0 ? remaining[0] : null;
            song.albumIds = remaining;
            await song.save();
        }
        await Album.findByIdAndDelete(id);
        return res.status(200).json({success: true, message: 'Album deleted successfully. Songs remain in the library.'});
    } catch (error) {
        console.log("Error in deleting album:", error);
        next(error);
    }
}

const updateAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artist, releaseDate } = req.body;
    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }

    if (title) album.title = title.trim();
    if (artist) album.artist = artist.trim();
    if (releaseDate) album.releaseDate = releaseDate.trim();

    if (req.files?.imageFile) {
      const imageUpload = await uploadToCloudinary(
        req.files.imageFile.tempFilePath,
        "albums/images"
      );
      album.imageUrl = imageUpload.secure_url;
    }

    await album.save();
    await album.populate("songs");

    return res.status(200).json({
      success: true,
      message: 'Album updated successfully',
      album,
    });
  } catch (error) {
    console.log("Error in updating album:", error);
    next(error);
  }
};

const addSongsToAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { songIds, songId } = req.body;

    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }

    const rawIds = Array.isArray(songIds) ? songIds : (songId ? [songId] : []);
    const idsToAdd = rawIds.filter((sid) => Boolean(sid) && sid !== "none");
    if (idsToAdd.length === 0) {
      return res.status(400).json({ success: false, message: 'No songs provided to add' });
    }

    // Use $each with $addToSet so MongoDB correctly adds multiple ObjectIds without CastError
    await Album.findByIdAndUpdate(id, {
      $addToSet: { songs: { $each: idsToAdd } },
    });

    // Update each song's album associations
    for (const sid of idsToAdd) {
      const song = await Song.findById(sid);
      if (song) {
        if (!song.albumIds) song.albumIds = [];
        if (!song.albumIds.some((aid) => String(aid) === String(id))) {
          song.albumIds.push(id);
        }
        if (!song.albumId) {
          song.albumId = id;
        }
        await song.save();
      }
    }

    const updatedAlbum = await Album.findById(id).populate("songs");
    return res.status(200).json({
      success: true,
      message: 'Songs added to album successfully',
      album: updatedAlbum,
    });
  } catch (error) {
    console.error("Error in adding songs to album:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add songs to album",
    });
  }
};

const removeSongFromAlbum = async (req, res, next) => {
  try {
    const { id, songId } = req.params;

    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }

    await Album.findByIdAndUpdate(id, {
      $pull: { songs: songId },
    });

    const song = await Song.findById(songId);
    if (song) {
      song.albumIds = (song.albumIds || []).filter((aid) => String(aid) !== String(id));
      if (String(song.albumId) === String(id)) {
        song.albumId = song.albumIds.length > 0 ? song.albumIds[0] : null;
      }
      await song.save();
    }

    const updatedAlbum = await Album.findById(id).populate("songs");
    return res.status(200).json({
      success: true,
      message: 'Song removed from album successfully',
      album: updatedAlbum,
    });
  } catch (error) {
    console.error("Error in removing song from album:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove song from album",
    });
  }
};

const getAllPlaylistsAdmin = async (req, res, next) => {
  try {
    const playlists = await Playlist.find()
      .sort({ createdAt: -1 })
      .populate("songs", "title artist duration imageUrl");
    return res.status(200).json({ success: true, playlists });
  } catch (error) {
    console.log("Error in getting all playlists:", error);
    next(error);
  }
};

const deletePlaylistAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const playlist = await Playlist.findByIdAndDelete(id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    return res.status(200).json({ success: true, message: 'Playlist deleted successfully' });
  } catch (error) {
    console.log("Error in deleting playlist:", error);
    next(error);
  }
};

const checkAdmin = async (req, res, next) => {
    res.status(200).json({success: true, message: 'You are an admin'});
}

export {
  createSong,
  deleteSong,
  updateSong,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addSongsToAlbum,
  removeSongFromAlbum,
  getAllPlaylistsAdmin,
  deletePlaylistAdmin,
  checkAdmin,
};