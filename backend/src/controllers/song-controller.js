import Song from "../models/Song.js"

const getAllSongs = async (req, res, next) => {
    try {
        const songs = await Song.find().sort({createdAt: -1});
        res.status(200).json(songs);
    } catch (error) {
        console.log("Error in getting all songs",error);
        
        next(error);
    }
}

const getFeaturedSongs = async (req, res, next) => {
    try{
        //fetch 6 songs using mongo db aggregation
        const songs = await Song.aggregate([
            {
                $sample: {
                    size: 6
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    artist: 1,
                    imageUrl: 1,
                    audioUrl: 1
                }
            }
        ]);
        res.status(200).json(songs);
    }
    catch(error){
        console.log("Error in getting featured songs:", error);
        next(error);
    }
}

const getMadeForYouSongs = async (req, res, next) => { 
    try{
        //fetch 4 songs using mongo db aggregation
        const songs = await Song.aggregate([
            {
                $sample: {
                    size: 4
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    artist: 1,
                    imageUrl: 1,
                    audioUrl: 1
                }
            }
        ]);
        res.status(200).json(songs);
    }
    catch(error){
        console.log("Error in getting made for you songs:", error);
        next(error);
    }
}

const getTrendingSongs = async (req, res, next) => {
    try{
        //fetch 4 songs using mongo db aggregation
        const songs = await Song.aggregate([
            {
                $sample: {
                    size: 4
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    artist: 1,
                    imageUrl: 1,
                    audioUrl: 1
                }
            }
        ]);
        res.status(200).json(songs);
    }
    catch(error){
        console.log("Error in getting trending songs:", error);
        next(error);
    }
}

export {getAllSongs, getFeaturedSongs, getMadeForYouSongs, getTrendingSongs};

//NEED TO UPDATE THESE FUNCTION IN FUTURE USING ML ALGORITHMS