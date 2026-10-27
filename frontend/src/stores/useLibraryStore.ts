import { create } from "zustand";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import type { Playlist, Song } from "@/types";

interface LibraryStore {
  playlists: Playlist[];
  likedSongs: Song[];
  likedSongIds: string[];
  recentlyPlayed: Song[];
  isLoading: boolean;
  error: unknown | null;

  fetchLibrary: () => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  fetchLikedSongs: () => Promise<void>;
  fetchRecentlyPlayed: () => Promise<void>;

  isLiked: (songId: string) => boolean;
  toggleLike: (song: Song) => Promise<void>;
  recordPlay: (song: Song) => Promise<void>;

  createPlaylist: (title: string, description?: string) => Promise<Playlist | null>;
  updatePlaylist: (
    playlistId: string,
    patch: Partial<Pick<Playlist, "title" | "description" | "isPublic">>
  ) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;

  reset: () => void;
}

const initialState = {
  playlists: [] as Playlist[],
  likedSongs: [] as Song[],
  likedSongIds: [] as string[],
  recentlyPlayed: [] as Song[],
  isLoading: false,
  error: null as unknown | null,
};

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  ...initialState,

  fetchLibrary: async () => {
    set({ isLoading: true, error: null });
    await Promise.all([
      get().fetchPlaylists(),
      get().fetchLikedSongs(),
      get().fetchRecentlyPlayed(),
    ]);
    set({ isLoading: false });
  },

  fetchPlaylists: async () => {
    try {
      const response = await axiosInstance.get("/playlists");
      set({ playlists: response.data });
    } catch (error) {
      set({ error });
    }
  },

  fetchLikedSongs: async () => {
    try {
      const [songsResponse, idsResponse] = await Promise.all([
        axiosInstance.get("/likes"),
        axiosInstance.get("/likes/ids"),
      ]);
      set({
        likedSongs: songsResponse.data,
        likedSongIds: idsResponse.data,
      });
    } catch (error) {
      set({ error });
    }
  },

  fetchRecentlyPlayed: async () => {
    try {
      const response = await axiosInstance.get("/history");
      set({ recentlyPlayed: response.data });
    } catch (error) {
      set({ error });
    }
  },

  isLiked: (songId: string) => get().likedSongIds.includes(songId),

  toggleLike: async (song: Song) => {
    const wasLiked = get().likedSongIds.includes(song._id);

    set((state) => ({
      likedSongIds: wasLiked
        ? state.likedSongIds.filter((id) => id !== song._id)
        : [...state.likedSongIds, song._id],
      likedSongs: wasLiked
        ? state.likedSongs.filter((item) => item._id !== song._id)
        : [song, ...state.likedSongs],
    }));

    try {
      const response = await axiosInstance.post(`/likes/${song._id}`);
      const liked = Boolean(response.data?.liked);
      set((state) => ({
        likedSongIds: liked
          ? Array.from(new Set([...state.likedSongIds, song._id]))
          : state.likedSongIds.filter((id) => id !== song._id),
        likedSongs: liked
          ? state.likedSongs.some((item) => item._id === song._id)
            ? state.likedSongs
            : [song, ...state.likedSongs]
          : state.likedSongs.filter((item) => item._id !== song._id),
      }));
    } catch (error) {
      set((state) => ({
        likedSongIds: wasLiked
          ? Array.from(new Set([...state.likedSongIds, song._id]))
          : state.likedSongIds.filter((id) => id !== song._id),
        likedSongs: wasLiked
          ? state.likedSongs.some((item) => item._id === song._id)
            ? state.likedSongs
            : [song, ...state.likedSongs]
          : state.likedSongs.filter((item) => item._id !== song._id),
        error,
      }));
      toast.error("Could not update Liked Songs");
    }
  },

  recordPlay: async (song: Song) => {
    set((state) => {
      const filtered = state.recentlyPlayed.filter((item) => item._id !== song._id);
      return {
        recentlyPlayed: [
          { ...song, lastPlayed: new Date().toISOString() },
          ...filtered,
        ].slice(0, 30),
      };
    });

    try {
      await axiosInstance.post("/history", { songId: song._id });
    } catch {
      // History is best-effort; signed-out users simply skip persistence.
    }
  },

  createPlaylist: async (title: string, description = "") => {
    try {
      const response = await axiosInstance.post("/playlists", { title, description });
      const playlist: Playlist = response.data;
      set((state) => ({ playlists: [playlist, ...state.playlists] }));
      toast.success("Playlist created");
      return playlist;
    } catch (error) {
      set({ error });
      toast.error("Could not create playlist");
      return null;
    }
  },

  updatePlaylist: async (playlistId, patch) => {
    try {
      const response = await axiosInstance.patch(`/playlists/${playlistId}`, patch);
      set((state) => ({
        playlists: state.playlists.map((playlist) =>
          playlist._id === playlistId ? response.data : playlist
        ),
      }));
    } catch (error) {
      set({ error });
      toast.error("Could not update playlist");
    }
  },

  deletePlaylist: async (playlistId: string) => {
    try {
      await axiosInstance.delete(`/playlists/${playlistId}`);
      set((state) => ({
        playlists: state.playlists.filter((playlist) => playlist._id !== playlistId),
      }));
      toast.success("Playlist deleted");
    } catch (error) {
      set({ error });
      toast.error("Could not delete playlist");
    }
  },

  addSongToPlaylist: async (playlistId: string, songId: string) => {
    try {
      const response = await axiosInstance.post(`/playlists/${playlistId}/songs`, {
        songId,
      });
      set((state) => ({
        playlists: state.playlists.map((playlist) =>
          playlist._id === playlistId ? response.data : playlist
        ),
      }));
      toast.success("Added to playlist");
    } catch (error) {
      set({ error });
      toast.error("Could not add song to playlist");
    }
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string) => {
    try {
      const response = await axiosInstance.delete(
        `/playlists/${playlistId}/songs/${songId}`
      );
      set((state) => ({
        playlists: state.playlists.map((playlist) =>
          playlist._id === playlistId ? response.data : playlist
        ),
      }));
      toast.success("Removed from playlist");
    } catch (error) {
      set({ error });
      toast.error("Could not remove song");
    }
  },

  reset: () => set({ ...initialState }),
}));
