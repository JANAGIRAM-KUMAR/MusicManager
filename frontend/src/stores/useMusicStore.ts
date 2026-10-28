import axiosInstance from '@/lib/axios';
import type { Album, Playlist, Song, Stats } from '@/types';
import toast from 'react-hot-toast';
import {create} from 'zustand';

interface MusicStore {
    albums: Album[];
    songs: Song[];
    adminPlaylists: Playlist[];
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
    updateSong: (id: string, data: Partial<Song>) => Promise<void>;
    deleteAlbum: (id: string) => Promise<void>;
    updateAlbum: (id: string, formData: FormData) => Promise<void>;
    addSongToAlbum: (songId: string, albumId: string) => Promise<void>;
    addSongsToAlbum: (albumId: string, songIds: string[]) => Promise<void>;
    removeSongFromAlbum: (albumId: string, songId: string) => Promise<void>;
    fetchAdminPlaylists: () => Promise<void>;
    deleteAdminPlaylist: (id: string) => Promise<void>;
}

export const useMusicStore = create<MusicStore>((set, get) => ({
    albums: [],
    songs: [], 
    adminPlaylists: [],
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
        } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error deleting song');
        console.log("Error in deleting song", error);
        set({ error, isLoading: false });
        }
    },
    updateSong: async (id: string, data: Partial<Song>) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/admin/songs/${id}`, data);
            set((state) => ({
                songs: state.songs.map((song) => song._id === id ? { ...song, ...response.data.song } : song)
            }))
            toast.success('Song updated successfully');
            set({ isLoading: false });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error updating song');
            console.log("Error in updating song", error);
            set({ error, isLoading: false });
        }
    },
    addSongToAlbum: async (songId: string, albumId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/admin/songs/${songId}`, { albumId });
            set((state) => ({
                songs: state.songs.map((song) => song._id === songId ? { ...song, albumId, ...response.data.song } : song)
            }))
            // Also refresh albums to update song lists
            const albumsResponse = await axiosInstance.get('/albums');
            set({ albums: albumsResponse.data });
            toast.success('Song added to album successfully');
            set({ isLoading: false });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error adding song to album');
            console.log("Error in adding song to album", error);
            set({ error, isLoading: false });
        }
    },
    updateAlbum: async (id: string, formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/admin/albums/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            set((state) => ({
                albums: state.albums.map((album) => album._id === id ? { ...album, ...response.data.album } : album)
            }));
            toast.success('Album updated successfully');
            set({ isLoading: false });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error updating album');
            console.log("Error in updating album", error);
            set({ error, isLoading: false });
        }
    },
    addSongsToAlbum: async (albumId: string, songIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post(`/admin/albums/${albumId}/songs`, { songIds });
            const updatedAlbum = response.data.album;
            set((state) => ({
                albums: state.albums.map((album) => album._id === albumId ? updatedAlbum : album)
            }));
            await Promise.all([get().fetchSongs(), get().fetchAlbums()]);
            toast.success('Songs added to album successfully');
            set({ isLoading: false });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error adding songs to album');
            console.log("Error in adding songs to album", error);
            set({ error, isLoading: false });
        }
    },
    removeSongFromAlbum: async (albumId: string, songId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.delete(`/admin/albums/${albumId}/songs/${songId}`);
            const updatedAlbum = response.data.album;
            set((state) => ({
                albums: state.albums.map((album) => album._id === albumId ? updatedAlbum : album)
            }));
            await Promise.all([get().fetchSongs(), get().fetchAlbums()]);
            toast.success('Song removed from album');
            set({ isLoading: false });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error removing song from album');
            console.log("Error in removing song from album", error);
            set({ error, isLoading: false });
        }
    },
    fetchAdminPlaylists: async () => {
        try {
            const response = await axiosInstance.get('/admin/playlists');
            set({ adminPlaylists: response.data.playlists || [] });
        } catch (error) {
            console.log("Error fetching admin playlists", error);
        }
    },
    deleteAdminPlaylist: async (id: string) => {
        try {
            await axiosInstance.delete(`/admin/playlists/${id}`);
            set((state) => ({
                adminPlaylists: state.adminPlaylists.filter((p) => p._id !== id)
            }));
            toast.success('Playlist deleted successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error deleting playlist');
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

