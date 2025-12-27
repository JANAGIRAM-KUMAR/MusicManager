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