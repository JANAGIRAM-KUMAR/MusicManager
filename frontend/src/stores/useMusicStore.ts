// global state
import axiosInstance from '@/lib/axios';
import type { Album, Song } from '@/types';
import {create} from 'zustand';

interface MusicStore {
    albums: Album[];
    songs: Song[];
    isLoading: boolean;
    error: unknown;

    fetchAlbums: () => Promise<void>;
    fetchAlbumById: (id: string) => Promise<void>;

    currentAlbum: Album | null;
    featuredSongs: Song[];
    madeForYouSongs: Song[];
    trendingSongs: Song[];

    fetchFeaturedSongs: () => Promise<void>;
    fetchMadeForYouSongs: () => Promise<void>;
    fetchTrendingSongs: () => Promise<void>;
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

    fetchAlbums: async() => {
        set({isLoading: true, error: null})
        try{
            const response = await axiosInstance.get('/albums');
            set({albums: response.data, isLoading: false})
        } catch(error) {
            set({error: error, isLoading: false})
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
    }
}));

