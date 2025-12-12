import Song from "../models/Song.js";
import Album from "../models/Album.js";
import cloudinary from '../lib/cloudinary.js';

// helper function to upload files to cloudinary
const uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto",
        });
        return result.secure_url;
    }
    catch (error) {
        throw new Error('Cloudinary upload failed: ' + error.message);
    }
}

const createSong = async (req, res, next) => {
    try{
        if(!req.files || !req.files.audioFile || !req.files.imageFile){
            return res.status(400).json({message: 'No file uploaded, please upload audio and image files'});
        }
        const {title, artist, albumId, duration} = req.body;
        const audioFile = req.files.audioFile;
        const imageFile = req.files.imageFile;

        //upload files to cloudinary
        const audioUrl = uploadToCloudinary(audioFile);
        const imageUrl = uploadToCloudinary(imageFile);

        const song = new Song({
            title,
            artist,
            albumId: albumId || null,
            duration,
            audioUrl,
            imageUrl
        });
        await song.save();

        // if song belongs to an album, update the album's song list
        if(albumId){
            await Album.findByIdAndUpdate(albumId, {$push: {songs: song._id}}); 
        }
        return res.status(201).json({message: 'Song created successfully', song});

    } catch(error){
        console.error("Error in create song controller:", err);
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
        const {title, artist, releaseDate} = req.body;
        const imageFile = req.files.imageFile;

        const imageUrl = uploadToCloudinary(imageFile);

        const album = new Album({
            title,
            artist,
            releaseDate,
            imageUrl
        });
        await album.save();
        return res.status(201).json({success: true, message: 'Album created successfully', album});
        
    } catch (error){
        console.log("Error in creating Album", error);
        next(error);
    }
}

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