import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { audioEngine } from "@/lib/audioEngine";
import type { EqSettings, RepeatMode, Song } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";

interface PlayerStore {
  queue: Song[];
  originalQueue: Song[];
  currentIndex: number;
  currentSong: Song | null;

  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  buffered: number;

  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
  crossfade: number;
  eq: EqSettings;
  graphMode: "webaudio" | "element";
  queueOpen: boolean;

  initializeQueue: (songs: Song[]) => void;
  playSongs: (songs: Song[], startIndex?: number) => void;
  playSong: (song: Song) => void;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playNext: (fromEnded?: boolean) => void;
  playPrevious: () => void;
  seek: (seconds: number) => void;

  toggleShuffle: () => void;
  cycleRepeat: () => void;

  addToQueue: (song: Song) => void;
  playNextInQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCrossfade: (ms: number) => void;
  setEq: (eq: EqSettings) => void;
  toggleQueue: () => void;
  setQueueOpen: (open: boolean) => void;
}

const shuffleArray = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const songArtwork = (song: Song) => {
  if (!song.imageUrl) return [];
  return [{ src: song.imageUrl, sizes: "512x512", type: "image/jpeg" }];
};

const updateMediaSession = (song: Song) => {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    album: song.albumId ? "Album" : "Single",
    artwork: songArtwork(song),
  });
};

const initialState = {
  queue: [] as Song[],
  originalQueue: [] as Song[],
  currentIndex: -1,
  currentSong: null as Song | null,
  isPlaying: false,
  isLoading: false,
  progress: 0,
  duration: 0,
  buffered: 0,
  volume: 0.7,
  muted: false,
  repeat: "off" as RepeatMode,
  shuffle: false,
  crossfade: 0,
  eq: { bass: 0, mid: 0, treble: 0 } as EqSettings,
  graphMode: "webaudio" as const,
  queueOpen: false,
};

const startAudio = async (song: Song) => {
  usePlayerStore.setState({ isLoading: true });
  try {
    await audioEngine.playUrl(song.songUrl, { autoplay: true });
  } catch (error) {
    console.error("Failed to start audio", error);
    toast.error("Playback failed");
    usePlayerStore.setState({ isLoading: false, isPlaying: false });
  }
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initializeQueue: (songs: Song[]) => {
        if (!Array.isArray(songs) || songs.length === 0) return;
        const currentSong = get().currentSong;
        const existingIndex = currentSong ? songs.findIndex((s) => s._id === currentSong._id) : -1;
        set({
          queue: songs,
          originalQueue: songs,
          currentSong: currentSong ?? songs[0],
          currentIndex: existingIndex !== -1 ? existingIndex : 0,
        });
      },

      playSongs: (songs: Song[], startIndex = 0) => {
        const authUser = useAuthStore.getState().user;
        if (!authUser) {
          toast.error("Log in to listen");
          useAuthStore.getState().openSignIn?.();
          return;
        }
        if (!Array.isArray(songs) || songs.length === 0) {
          toast.error("No songs available to play");
          return;
        }
        const validSongs = songs.filter((s: any) => s && s.songUrl);
        if (validSongs.length === 0) {
          toast.error("No playable songs in this selection");
          return;
        }
        const safeIndex = Math.min(Math.max(startIndex, 0), validSongs.length - 1);
        const selected = validSongs[safeIndex];
        if (get().shuffle) {
          const rest = validSongs.filter((_: any, idx: number) => idx !== safeIndex);
          const shuffled = [selected, ...shuffleArray(rest)];
          set({ queue: shuffled, originalQueue: validSongs, currentIndex: 0, currentSong: selected });
          void startAudio(selected);
          updateMediaSession(selected);
          return;
        }
        set({ queue: validSongs, originalQueue: validSongs, currentIndex: safeIndex, currentSong: selected });
        void startAudio(selected);
        updateMediaSession(selected);
      },

      playSong: (song: Song) => {
        const authUser = useAuthStore.getState().user;
        if (!authUser) {
          toast.error("Log in to listen");
          useAuthStore.getState().openSignIn?.();
          return;
        }
        const { queue } = get();
        let index = queue.findIndex((item: any) => item._id === song._id);
        if (index === -1) {
          const insertAt = get().currentIndex >= 0 ? Math.min(get().currentIndex + 1, queue.length) : queue.length;
          const nextQueue = [...queue];
          nextQueue.splice(insertAt, 0, song);
          set({ queue: nextQueue, originalQueue: [...get().originalQueue, song] });
          index = insertAt;
        }
        set({ currentIndex: index, currentSong: song });
        void startAudio(song);
        updateMediaSession(song);
      },

      setCurrentSong: (song: Song | null) => {
        if (!song) return;
        get().playSong(song);
      },

      togglePlay: () => {
        const { currentSong, queue, currentIndex, isPlaying } = get();
        if (!currentSong) {
          const first = queue[Math.max(currentIndex, 0)] || queue[0];
          if (first) get().playSong(first);
          return;
        }
        if (!audioEngine.hasSource()) {
          void startAudio(currentSong);
          return;
        }
        if (isPlaying) {
          audioEngine.pause();
          set({ isPlaying: false });
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
        } else {
          void audioEngine.play().then(() => {
            set({ isPlaying: true });
            if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
          });
        }
      },

      playNext: (fromEnded = false) => {
        const { queue, currentIndex, repeat } = get();
        if (queue.length === 0) return;
        if (repeat === "one" && !fromEnded) {
          const current = get().currentSong;
          if (current) {
            audioEngine.seek(0);
            void audioEngine.play();
            set({ isPlaying: true });
            updateMediaSession(current);
          }
          return;
        }
        let nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeat === "all") nextIndex = 0;
          else {
            set({ isPlaying: false });
            updateMediaSession(queue[currentIndex]);
            return;
          }
        }
        const nextSong = queue[nextIndex];
        set({ currentIndex: nextIndex, currentSong: nextSong });
        void startAudio(nextSong);
        updateMediaSession(nextSong);
      },

      playPrevious: () => {
        const { queue, currentIndex } = get();
        if (queue.length === 0) return;
        if (audioEngine.getCurrentTime() > 3) {
          audioEngine.seek(0);
          return;
        }
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = queue.length - 1;
        const prevSong = queue[prevIndex];
        set({ currentIndex: prevIndex, currentSong: prevSong });
        void startAudio(prevSong);
        updateMediaSession(prevSong);
      },

      seek: (seconds: number) => {
        audioEngine.seek(seconds);
      },

      toggleShuffle: () => {
        set((s: any) => {
          const shuffle = !s.shuffle;
          if (shuffle && s.currentSong) {
            const rest = s.queue.filter((q: any) => q._id !== s.currentSong._id);
            const shuffled = [s.currentSong, ...shuffleArray(rest)];
            const idx = shuffled.findIndex((q: any) => q._id === s.currentSong._id);
            return { shuffle, queue: shuffled, currentIndex: idx >= 0 ? idx : 0 };
          }
          return { shuffle };
        });
      },

      cycleRepeat: () => {
        const order: RepeatMode[] = ["off", "all", "one"];
        const current = get().repeat;
        const next = order[(order.indexOf(current) + 1) % order.length];
        set({ repeat: next });
      },

      addToQueue: (song: Song) => {
        set((s: any) => ({
          queue: [...s.queue, song],
          originalQueue: s.originalQueue.some((item: any) => item._id === song._id) ? s.originalQueue : [...s.originalQueue, song],
        }));
      },

      playNextInQueue: (song: Song) => {
        const { currentIndex, currentSong } = get();
        if (!currentSong) {
          get().playSong(song);
          return;
        }
        set((s: any) => {
          const filtered = s.queue.filter((_: any, idx: number) => !(s.queue[idx]._id === song._id && idx > currentIndex));
          const insertAt = Math.max(currentIndex + 1, 0);
          const nextQueue = [...filtered];
          nextQueue.splice(insertAt, 0, song);
          return {
            queue: nextQueue,
            originalQueue: s.originalQueue.some((item: any) => item._id === song._id) ? s.originalQueue : [...s.originalQueue, song],
          };
        });
      },

      removeFromQueue: (index: number) => {
        const { queue, currentIndex } = get();
        if (index < 0 || index >= queue.length) return;
        const nextQueue = queue.filter((_: any, itemIndex: number) => itemIndex !== index);
        if (index === currentIndex) {
          if (nextQueue.length === 0) {
            audioEngine.pause();
            set({ queue: [], currentSong: null, currentIndex: -1, isPlaying: false });
            return;
          }
          const replacement = nextQueue[Math.min(index, nextQueue.length - 1)];
          set({ queue: nextQueue, currentIndex: Math.min(index, nextQueue.length - 1), currentSong: replacement });
          void startAudio(replacement);
          updateMediaSession(replacement);
          return;
        }
        set({ queue: nextQueue, currentIndex: index < currentIndex ? currentIndex - 1 : currentIndex });
      },

      clearQueue: () => {
        const current = get().currentSong;
        if (current) {
          set({ queue: [current], originalQueue: [current], currentIndex: 0 });
          return;
        }
        set({ queue: [], originalQueue: [], currentIndex: -1, currentSong: null });
      },

      setVolume: (volume: number) => {
        const clamped = Math.min(Math.max(volume, 0), 1);
        audioEngine.setVolume(clamped);
        audioEngine.setMuted(clamped === 0);
        set({ volume: clamped, muted: clamped === 0 });
      },

      toggleMute: () => {
        const next = !get().muted;
        audioEngine.setMuted(next);
        set({ muted: next });
      },

      setCrossfade: (ms: number) => {
        const clamped = Math.min(Math.max(ms, 0), 12000);
        audioEngine.setCrossfade(clamped);
        set({ crossfade: clamped });
      },

      setEq: (eq: EqSettings) => {
        audioEngine.setEq(eq);
        set({ eq });
      },

      toggleQueue: () => set((s: any) => ({ queueOpen: !s.queueOpen })),
      setQueueOpen: (open: boolean) => set({ queueOpen: open }),
    }),
    {
      name: "soundwave-player-settings",
      partialize: (persistState: any) => ({
        volume: persistState.volume,
        muted: persistState.muted,
        repeat: persistState.repeat,
        shuffle: persistState.shuffle,
        crossfade: persistState.crossfade,
        eq: persistState.eq,
      }),
      onRehydrateStorage: () => (rehydratedState: any) => {
        if (!rehydratedState) return;
        try {
          audioEngine.setVolume(rehydratedState.volume ?? 0.7);
          audioEngine.setMuted(rehydratedState.muted ?? false);
          audioEngine.setCrossfade(rehydratedState.crossfade ?? 0);
          audioEngine.setEq(rehydratedState.eq ?? { bass: 0, mid: 0, treble: 0 });
        } catch {}
      },
    }
  )
);

audioEngine.on("time", ({ currentTime, duration, buffered }: any) => {
  usePlayerStore.setState(() => ({ progress: currentTime, duration, buffered }));
});

audioEngine.on("play", () => {
  usePlayerStore.setState({ isPlaying: true, isLoading: false });
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
});

audioEngine.on("pause", () => {
  usePlayerStore.setState({ isPlaying: false });
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
});

audioEngine.on("ended", () => {
  usePlayerStore.getState().playNext(true);
});

audioEngine.on("loading", ({ loading }: any) => {
  usePlayerStore.setState({ isLoading: loading });
});

audioEngine.on("error", ({ message }: any) => {
  usePlayerStore.setState({ isPlaying: false, isLoading: false });
  toast.error(message || "Playback failed");
});

audioEngine.on("graph", ({ mode }: any) => {
  usePlayerStore.setState({ graphMode: mode });
});

if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => {
    const s = usePlayerStore.getState();
    if (!s.isPlaying) s.togglePlay();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    const s = usePlayerStore.getState();
    if (s.isPlaying) s.togglePlay();
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => usePlayerStore.getState().playNext());
  navigator.mediaSession.setActionHandler("previoustrack", () => usePlayerStore.getState().playPrevious());
  navigator.mediaSession.setActionHandler("seekto", (details: any) => {
    if (typeof details.seekTime === "number") usePlayerStore.getState().seek(details.seekTime);
  });
}
