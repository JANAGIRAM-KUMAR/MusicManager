export interface Song {
    _id: string;
    title: string;
    albumId: string | null;
    albumIds?: string[];
    artist: string;
    imageUrl: string;
    songUrl: string;
    duration: number;
    plays?: number;
    createdAt: string;
    updatedAt: string;
    lastPlayed?: string;
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

export interface Playlist {
    _id: string;
    title: string;
    description: string;
    ownerId: string;
    imageUrl: string;
    songs: Song[];
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Artist {
    name: string;
    imageUrl: string;
    songCount: number;
    duration: number;
}

export interface ArtistDetail {
    artist: Artist & { albumCount: number };
    songs: Song[];
    albums: Album[];
}

export interface SearchResults {
    query: string;
    songs: Song[];
    albums: Album[];
    artists: Artist[];
}

export interface Stats {
    totalSongs: number;
    totalAlbums: number;
    totalUsers: number;
    totalArtists: number;
    totalPlaylists?: number;
    totalPlays?: number;
    totalLikes?: number;
    recentUsers?: User[];
    topSongs?: Array<{
        _id: string;
        title: string;
        artist: string;
        imageUrl: string;
        plays: number;
    }>;
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
    googleId?: string;
    email: string;
    fullName: string;
    imageUrl: string;
    authProvider?: string;
    createdAt?: string;
    isAdmin?: boolean;
    playlistCount?: number;
    likesCount?: number;
    playsCount?: number;
}

export type RepeatMode = "off" | "all" | "one";

export type EqPresetName =
  | "Flat"
  | "Bass Boost"
  | "Bass Reducer"
  | "Vocal Booster"
  | "Treble Booster"
  | "Electronic"
  | "Hip-Hop"
  | "Rock"
  | "Pop"
  | "Acoustic"
  | "Classical"
  | "Lounge"
  | "Custom";

export interface EqSettings {
  enabled?: boolean;
  preset?: EqPresetName;
  bass: number;
  mid: number;
  treble: number;
}

export type AudioQuality = "lossless" | "high" | "normal" | "saver";

export interface AudioSettings {
  eq: EqSettings;
  playbackRate: number;
  crossfadeMs: number;
  normalizeVolume: boolean;
  stereoPan: number;
  audioQuality: AudioQuality;
}
