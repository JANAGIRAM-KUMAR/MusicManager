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

export {createSong};