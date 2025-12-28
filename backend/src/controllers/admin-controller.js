import Song from "../models/Song.js";
import Album from "../models/Album.js";
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

    const { title, artist, albumId, duration } = req.body;

    const audioFile = req.files.audioFile;
    const imageFile = req.files.imageFile;

    console.log("AUDIO PATH:", audioFile.tempFilePath);
    console.log("IMAGE PATH:", imageFile.tempFilePath);

    const audioUpload = await uploadToCloudinary(
      audioFile.tempFilePath,
      "songs/audio"
    );

    const imageUpload = await uploadToCloudinary(
      imageFile.tempFilePath,
      "songs/images"
    );

    const song = await Song.create({
      title,
      artist,
      albumId: albumId || null,
      duration,
      songUrl: audioUpload.secure_url,
      imageUrl: imageUpload.secure_url,
    });

    if (albumId) {
      await Album.findByIdAndUpdate(albumId, {
        $push: { songs: song._id },
      });
    }

    return res.status(201).json({
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

        //if the song is in album update the album's list
        if(song.albumId){
            await Album.findByIdAndUpdate(song.albumId, {$pull: {songs: song._id}});
        }
        await Song.findByIdAndDelete(id);
        return res.status(200).json({message: 'Song deleted successfully'}); 

    } catch (error) {
        console.log("Error in deleting song:", error);
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
        await Song.deleteMany({albumId: id});
        await Album.findByIdAndDelete(id);
        return res.status(200).json({success: true, message: 'Album deleted successfully'});
    } catch (error) {
        console.log("Error in deleting album:", error);
        next(error);
    }
}

const checkAdmin = async (req, res, next) => {
    res.status(200).json({success: true, message: 'You are an admin'});
}

export {createSong, deleteSong, createAlbum, deleteAlbum, checkAdmin};