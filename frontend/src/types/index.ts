export interface Song {
    _id: string;
    title: string;
    albumId: string | null;
    artist: string;
    imageUrl: string;
    songUrl: string;
    duration: number;
    createdAt: string;
    updatedAt: string;
}

export interface Album {
    _id: string;
    title: string;
    artist: string;
    imageUrl: string;
    releaseDate: string;
    songs: Song[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Stats {
    totalSongs: number;
    totalAlbums: number;
    totalUsers: number;
    totalArtists: number
}

export interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    _id: string;
    clerkId: string;
    fullName: string;
    imageUrl: string;
}