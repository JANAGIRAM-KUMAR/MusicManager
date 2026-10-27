import { create } from "zustand";
import axiosInstance from "@/lib/axios";
import type { Artist, ArtistDetail, SearchResults } from "@/types";

interface BrowseStore {
  query: string;
  results: SearchResults;
  isSearching: boolean;

  artists: Artist[];
  artistsLoading: boolean;

  artistDetail: ArtistDetail | null;
  artistLoading: boolean;

  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  fetchArtists: () => Promise<void>;
  fetchArtist: (name: string) => Promise<ArtistDetail | null>;
}

const emptyResults: SearchResults = {
  query: "",
  songs: [],
  albums: [],
  artists: [],
};

export const useBrowseStore = create<BrowseStore>((set) => ({
  query: "",
  results: emptyResults,
  isSearching: false,

  artists: [],
  artistsLoading: false,

  artistDetail: null,
  artistLoading: false,

  search: async (query: string) => {
    const trimmed = query.trim();
    set({ query });
    if (!trimmed) {
      set({ results: emptyResults, isSearching: false });
      return;
    }

    set({ isSearching: true });
    try {
      const response = await axiosInstance.get("/browse", {
        params: { q: trimmed },
      });
      set({ results: response.data, isSearching: false });
    } catch {
      set({ isSearching: false });
    }
  },

  clearSearch: () => set({ query: "", results: emptyResults, isSearching: false }),

  fetchArtists: async () => {
    set({ artistsLoading: true });
    try {
      const response = await axiosInstance.get("/browse/artists");
      set({ artists: response.data, artistsLoading: false });
    } catch {
      set({ artistsLoading: false });
    }
  },

  fetchArtist: async (name: string) => {
    set({ artistLoading: true, artistDetail: null });
    try {
      const response = await axiosInstance.get(
        `/browse/artists/${encodeURIComponent(name)}`
      );
      set({ artistDetail: response.data, artistLoading: false });
      return response.data as ArtistDetail;
    } catch {
      set({ artistLoading: false });
      return null;
    }
  },
}));
