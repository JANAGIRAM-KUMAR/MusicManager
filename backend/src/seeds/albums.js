import mongoose from "mongoose";
import Album from "../models/Album.js";
import Song from "../models/Song.js";
import { config } from "dotenv";

config();

const seedDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);

		// Clear existing data
		await Album.deleteMany({});
		await Song.deleteMany({});

		// First, create all songs
		const createdSongs = await Song.insertMany([
			{
				title: "City Rain",
				artist: "Urban Echo",
				imageUrl: "/cover-images/7.svg",
				songUrl: "/songs/7.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 39, // 0:39
			},
			{
				title: "Neon Lights",
				artist: "Night Runners",
				imageUrl: "/cover-images/5.svg",
				songUrl: "/songs/5.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 36, // 0:36
			},
			{
				title: "Urban Jungle",
				artist: "City Lights",
				imageUrl: "/cover-images/15.svg",
				songUrl: "/songs/15.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 36, // 0:36
			},
			{
				title: "Neon Dreams",
				artist: "Cyber Pulse",
				imageUrl: "/cover-images/13.svg",
				songUrl: "/songs/13.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 39, // 0:39
			},
			{
				title: "Summer Daze",
				artist: "Coastal Kids",
				imageUrl: "/cover-images/4.svg",
				songUrl: "/songs/4.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 24, // 0:24
			},
			{
				title: "Ocean Waves",
				artist: "Coastal Drift",
				imageUrl: "/cover-images/9.svg",
				songUrl: "/songs/9.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 28, // 0:28
			},
			{
				title: "Crystal Rain",
				artist: "Echo Valley",
				imageUrl: "/cover-images/16.svg",
				songUrl: "/songs/16.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 39, // 0:39
			},
			{
				title: "Starlight",
				artist: "Luna Bay",
				imageUrl: "/cover-images/10.svg",
				songUrl: "/songs/10.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 30, // 0:30
			},
			{
				title: "Stay With Me",
				artist: "Sarah Mitchell",
				imageUrl: "/cover-images/1.svg",
				songUrl: "/songs/1.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 46, // 0:46
			},
			{
				title: "Midnight Drive",
				artist: "The Wanderers",
				imageUrl: "/cover-images/2.svg",
				songUrl: "/songs/2.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 41, // 0:41
			},
			{
				title: "Moonlight Dance",
				artist: "Silver Shadows",
				imageUrl: "/cover-images/14.svg",
				songUrl: "/songs/14.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 27, // 0:27
			},
			{
				title: "Lost in Tokyo",
				artist: "Electric Dreams",
				imageUrl: "/cover-images/3.svg",
				songUrl: "/songs/3.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 24, // 0:24
			},
			{
				title: "Neon Tokyo",
				artist: "Future Pulse",
				imageUrl: "/cover-images/17.svg",
				songUrl: "/songs/17.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 39, // 0:39
			},
			{
				title: "Purple Sunset",
				artist: "Dream Valley",
				imageUrl: "/cover-images/12.svg",
				songUrl: "/songs/12.wav",
				plays: Math.floor(Math.random() * 5000),
				duration: 17, // 0:17
			},
		]);

		// Create albums with references to song IDs
		const albums = [
			{
				title: "Urban Nights",
				artist: "Various Artists",
				imageUrl: "/albums/1.svg",
				releaseDate: 2024,
				songs: createdSongs.slice(0, 4).map((song) => song._id),
			},
			{
				title: "Coastal Dreaming",
				artist: "Various Artists",
				imageUrl: "/albums/2.svg",
				releaseDate: 2024,
				songs: createdSongs.slice(4, 8).map((song) => song._id),
			},
			{
				title: "Midnight Sessions",
				artist: "Various Artists",
				imageUrl: "/albums/3.svg",
				releaseDate: 2024,
				songs: createdSongs.slice(8, 11).map((song) => song._id),
			},
			{
				title: "Eastern Dreams",
				artist: "Various Artists",
				imageUrl: "/albums/4.svg",
				releaseDate: 2024,
				songs: createdSongs.slice(11, 14).map((song) => song._id),
			},
		];

		// Insert all albums
		const createdAlbums = await Album.insertMany(albums);

		// Update songs with their album references
		for (let i = 0; i < createdAlbums.length; i++) {
			const album = createdAlbums[i];
			const albumSongs = albums[i].songs;

			await Song.updateMany({ _id: { $in: albumSongs } }, { albumId: album._id });
		}

		console.log("Database seeded successfully!");
	} catch (error) {
		console.error("Error seeding database:", error);
	} finally {
		mongoose.connection.close();
	}
};

seedDatabase();