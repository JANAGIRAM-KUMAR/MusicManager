import mongoose from "mongoose";
import Song from "../models/Song.js";
import { config } from "dotenv";

config();

const songs = [
	{
		title: "Stay With Me",
		artist: "Sarah Mitchell",
		imageUrl: "/cover-images/1.svg",
		songUrl: "/songs/1.wav",
		duration: 46, // 0:46
	},
	{
		title: "Midnight Drive",
		artist: "The Wanderers",
		imageUrl: "/cover-images/2.svg",
		songUrl: "/songs/2.wav",
		duration: 41, // 0:41
	},
	{
		title: "Lost in Tokyo",
		artist: "Electric Dreams",
		imageUrl: "/cover-images/3.svg",
		songUrl: "/songs/3.wav",
		duration: 24, // 0:24
	},
	{
		title: "Summer Daze",
		artist: "Coastal Kids",
		imageUrl: "/cover-images/4.svg",
		songUrl: "/songs/4.wav",
		duration: 24, // 0:24
	},
	{
		title: "Neon Lights",
		artist: "Night Runners",
		imageUrl: "/cover-images/5.svg",
		songUrl: "/songs/5.wav",
		duration: 36, // 0:36
	},
	{
		title: "Mountain High",
		artist: "The Wild Ones",
		imageUrl: "/cover-images/6.svg",
		songUrl: "/songs/6.wav",
		duration: 40, // 0:40
	},
	{
		title: "City Rain",
		artist: "Urban Echo",
		imageUrl: "/cover-images/7.svg",
		songUrl: "/songs/7.wav",
		duration: 39, // 0:39
	},
	{
		title: "Desert Wind",
		artist: "Sahara Sons",
		imageUrl: "/cover-images/8.svg",
		songUrl: "/songs/8.wav",
		duration: 28, // 0:28
	},
	{
		title: "Ocean Waves",
		artist: "Coastal Drift",
		imageUrl: "/cover-images/9.svg",
		songUrl: "/songs/9.wav",
		duration: 28, // 0:28
	},
	{
		title: "Starlight",
		artist: "Luna Bay",
		imageUrl: "/cover-images/10.svg",
		songUrl: "/songs/10.wav",
		duration: 30, // 0:30
	},
	{
		title: "Winter Dreams",
		artist: "Arctic Pulse",
		imageUrl: "/cover-images/11.svg",
		songUrl: "/songs/11.wav",
		duration: 29, // 0:29
	},
	{
		title: "Purple Sunset",
		artist: "Dream Valley",
		imageUrl: "/cover-images/12.svg",
		songUrl: "/songs/12.wav",
		duration: 17, // 0:17
	},
	{
		title: "Neon Dreams",
		artist: "Cyber Pulse",
		imageUrl: "/cover-images/13.svg",
		songUrl: "/songs/13.wav",
		duration: 39, // 0:39
	},
	{
		title: "Moonlight Dance",
		artist: "Silver Shadows",
		imageUrl: "/cover-images/14.svg",
		songUrl: "/songs/14.wav",
		duration: 27, // 0:27
	},
	{
		title: "Urban Jungle",
		artist: "City Lights",
		imageUrl: "/cover-images/15.svg",
		songUrl: "/songs/15.wav",
		duration: 36, // 0:36
	},
	{
		title: "Crystal Rain",
		artist: "Echo Valley",
		imageUrl: "/cover-images/16.svg",
		songUrl: "/songs/16.wav",
		duration: 39, // 0:39
	},
	{
		title: "Neon Tokyo",
		artist: "Future Pulse",
		imageUrl: "/cover-images/17.svg",
		songUrl: "/songs/17.wav",
		duration: 39, // 0:39
	},
	{
		title: "Midnight Blues",
		artist: "Jazz Cats",
		imageUrl: "/cover-images/18.svg",
		songUrl: "/songs/18.wav",
		duration: 29, // 0:29
	},
];

const seedSongs = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);

		// Clear existing songs
		await Song.deleteMany({});

		// Insert new songs
		await Song.insertMany(songs);

		console.log("Songs seeded successfully!");
	} catch (error) {
		console.error("Error seeding songs:", error);
	} finally {
		mongoose.connection.close();
	}
};

seedSongs();