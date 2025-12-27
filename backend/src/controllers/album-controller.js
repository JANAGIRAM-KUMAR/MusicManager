import Album from "../models/Album.js";
const getAlbums = async (req, res, next) => {
    try{
        const albums = await Album.find();
        res.status(200).json(albums);
    } catch(error){
        next(error);
    }
}

const getAlbumById = async (req, res, next) => {
    try {
        const {albumId} = req.params;
        const album = await Album.findById(albumId).populate("songs"); // added async await
        if(!album){
            return res.status(404).json({success: false, message: 'Album not found'});
        }
        res.status(200).json(album);
        
    } catch (error) {
        next(error);
    }
}

export {getAlbums, getAlbumById};