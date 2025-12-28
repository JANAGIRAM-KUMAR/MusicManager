// global state
import axiosInstance from '@/lib/axios';
import type { Album, Song, Stats } from '@/types';
import toast from 'react-hot-toast';
import {create} from 'zustand';

interface MusicStore {
    albums: Album[];
    songs: Song[];
    isLoading: boolean;
    error: unknown;
    stats: Stats;

    fetchAlbums: () => Promise<void>;
    fetchAlbumById: (id: string) => Promise<void>;

    currentAlbum: Album | null;
    featuredSongs: Song[];
    madeForYouSongs: Song[];
    trendingSongs: Song[];

    fetchFeaturedSongs: () => Promise<void>;
    fetchMadeForYouSongs: () => Promise<void>;
    fetchTrendingSongs: () => Promise<void>;
    fetchStats: () => Promise<void>;
    fetchSongs: () => Promise<void>;
    deleteSong: (id: string) => Promise<void>;
    deleteAlbum: (id: string) => Promise<void>;
}

export const useMusicStore = create<MusicStore>((set) => ({
    albums: [],
    songs: [], 
    isLoading: false,
    error: null,
    currentAlbum: null,
    featuredSongs: [],
    madeForYouSongs: [],
    trendingSongs: [],
    stats: {
        totalAlbums: 0,
        totalSongs: 0,
        totalUsers: 0,
        totalArtists: 0
    },

    fetchAlbums: async() => {
        set({isLoading: true, error: null})
        try{
            const response = await axiosInstance.get('/albums');
            set({albums: response.data, isLoading: false})
        } catch(error) {
            set({error: error, isLoading: false})
        }
    },
    fetchSongs: async() => {
        set({isLoading: true, error: null})
        try{
            const response = await axiosInstance.get('/songs');
            set({songs: response.data, isLoading: false})
        } catch(error) {
            set({error: error, isLoading: false})
        }
    },
    fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
        const response = await axiosInstance.get('/stats');
        set((state) => ({
        stats: {
            ...state.stats,
            ...response.data,
        },
        isLoading: false,
        }));
    } catch (error) {
        set({ error, isLoading: false });
    }
    },
    deleteSong: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
        await axiosInstance.delete(`/admin/songs/${id}`);
        set((state) => ({
            songs: state.songs.filter((song) => song._id !== id), //filter the song that we just deleted
        }))
        toast.success('Song deleted successfully');
        set({ isLoading: false });
        } catch (error) {
        toast.error('Error deleting song');
        console.log("Error in deleting song", error);
        set({ error, isLoading: false });
        }
    },
    deleteAlbum: async (id: string) => {
        set({ isLoading: true, error: null });
        try{
            await axiosInstance.delete(`/admin/albums/${id}`);
            set((state) => ({
                albums: state.albums.filter((album) => album._id !== id), //filter the album that we just deleted
                songs: state.songs.map((song) =>
					song.albumId === state.albums.find((a) => a._id === id)?.title ? { ...song, album: null } : song
				),
            }))
            toast.success('Album deleted successfully');
            set({ isLoading: false });
        } catch (error) {
            toast.error('Error deleting album');
            console.log("Error in deleting album", error);
            set({ error, isLoading: false });
        }
    },
    fetchAlbumById: async(id: string) => {
        set({isLoading: true, error: null})
        try{
            const response = await axiosInstance.get(`/albums/${id}`);
            set({currentAlbum: response.data, isLoading: false})
        } catch(error) {
            set({error: error, isLoading: false})
        }
    },

    fetchFeaturedSongs: async() => {
        set({isLoading: true, error: null});
        try{
            const response = await axiosInstance.get('/songs/featured');
            set({featuredSongs: response.data, isLoading: false})
        } catch(error) {
            set({error: error, isLoading: false})
        }
    },

    fetchMadeForYouSongs: async() => {
        set({isLoading: true, error: null});
        try{
            const response = await axiosInstance.get('/songs/made-for-you');
            set({madeForYouSongs: response.data, isLoading: false})
        } catch(error) {
            set({error: error, isLoading: false})
        }
    },

    fetchTrendingSongs: async() => {
        set({isLoading: true, error: null});
        try{
            const response = await axiosInstance.get('/songs/trending');
            set({trendingSongs: response.data, isLoading: false})
        } catch(error) {
            set({error: error, isLoading: false})
        }
    },

    
}));

