import Song from '../models/Song.js';
import User from '../models/User.js';
import Album from '../models/Album.js';

const getStats = async (req, res, next) => {
    try {
        // const totalSongs = await Song.countDocuments();
        // const totalUsers = await User.countDocuments();
        // const totalAlbums = await Album.countDocuments(); 
        const [totalSongs, totalUsers, totalAlbums, uniqueArtists] = await Promise.all([
            Song.countDocuments(),
            User.countDocuments(),
            Album.countDocuments(),

            Song.aggregate([
                {
                    $unionWith: {
                        coll: "albums",
                        pipeline: []
                    },
                },
                {
                    $group: {
                        _id: "$artist",
                    },
                },
                {
                    $count: "count"
                },
            ]),
        ]);
        res.status(200).json({
            totalSongs, 
            totalUsers, 
            totalAlbums,
            totalArtists: uniqueArtists[0]?.count || 0
        });
        
    } catch (error) {
        console.log("Error in getting total stats", error);
        next(error);
    }
}

export {
    getStats
};