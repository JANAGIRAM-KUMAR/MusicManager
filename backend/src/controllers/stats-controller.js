import Song from '../models/Song.js';
import User from '../models/User.js';
import Album from '../models/Album.js';
import Playlist from '../models/Playlist.js';
import Like from '../models/Like.js';
import PlayHistory from '../models/PlayHistory.js';

const getStats = async (req, res, next) => {
    try {
        const [
            totalSongs,
            totalUsers,
            totalAlbums,
            totalPlaylists,
            totalPlays,
            totalLikes,
            uniqueArtists,
            recentUsers,
            topSongsAgg
        ] = await Promise.all([
            Song.countDocuments(),
            User.countDocuments(),
            Album.countDocuments(),
            Playlist.countDocuments(),
            PlayHistory.countDocuments(),
            Like.countDocuments(),

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

            User.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select("fullName email imageUrl createdAt authProvider"),

            PlayHistory.aggregate([
                {
                    $group: {
                        _id: "$songId",
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
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
                    $project: {
                        _id: "$song._id",
                        title: "$song.title",
                        artist: "$song.artist",
                        imageUrl: "$song.imageUrl",
                        plays: "$count",
                    },
                },
            ]),
        ]);

        res.status(200).json({
            totalSongs, 
            totalUsers, 
            totalAlbums,
            totalArtists: uniqueArtists[0]?.count || 0,
            totalPlaylists,
            totalPlays,
            totalLikes,
            recentUsers,
            topSongs: topSongsAgg,
        });
        
    } catch (error) {
        console.log("Error in getting total stats", error);
        next(error);
    }
}

export {
    getStats
};