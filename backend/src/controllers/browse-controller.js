import Song from "../models/Song.js";
import Album from "../models/Album.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const artistPipeline = (match) => [
  { $match: match },
  {
    $group: {
      _id: "$artist",
      songCount: { $sum: 1 },
      imageUrl: { $first: "$imageUrl" },
      duration: { $sum: "$duration" },
    },
  },
  {
    $project: {
      _id: 0,
      name: "$_id",
      songCount: 1,
      imageUrl: 1,
      duration: 1,
    },
  },
];

const search = async (req, res, next) => {
  try {
    const query = (req.query.q || "").toString().trim().slice(0, 100);
    if (!query) {
      return res.status(200).json({ query, songs: [], albums: [], artists: [] });
    }

    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const regex = new RegExp(escapeRegex(query), "i");

    const [songs, albums, artists] = await Promise.all([
      Song.find({ $or: [{ title: regex }, { artist: regex }] })
        .limit(limit)
        .sort({ createdAt: -1 }),
      Album.find({ $or: [{ title: regex }, { artist: regex }] }).limit(
        Math.min(limit, 12)
      ),
      Song.aggregate([
        ...artistPipeline({ $or: [{ artist: regex }, { title: regex }] }),
        { $sort: { songCount: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.status(200).json({ query, songs, albums, artists });
  } catch (error) {
    next(error);
  }
};

const getArtists = async (req, res, next) => {
  try {
    const artists = await Song.aggregate([
      ...artistPipeline({}),
      { $sort: { songCount: -1 } },
      { $limit: 100 },
    ]);
    res.status(200).json(artists);
  } catch (error) {
    next(error);
  }
};

const getArtistByName = async (req, res, next) => {
  try {
    const name = (req.params.artistName || "").toString().trim().slice(0, 100);
    if (!name) {
      return res.status(400).json({ success: false, message: "Artist name is required" });
    }
    const regex = new RegExp(`^${escapeRegex(name)}$`, "i");

    const [songs, albums] = await Promise.all([
      Song.find({ artist: regex }).sort({ createdAt: 1 }),
      Album.find({ artist: regex }).sort({ releaseDate: -1 }),
    ]);

    if (songs.length === 0 && albums.length === 0) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }

    const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);

    res.status(200).json({
      artist: {
        name: songs[0]?.artist || albums[0]?.artist || name,
        imageUrl: songs[0]?.imageUrl || albums[0]?.imageUrl || "",
        songCount: songs.length,
        albumCount: albums.length,
        duration: totalDuration,
      },
      songs,
      albums,
    });
  } catch (error) {
    next(error);
  }
};

export { search, getArtists, getArtistByName };
