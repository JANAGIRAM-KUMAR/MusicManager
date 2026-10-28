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
  lyricsOpen: boolean;

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
  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
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

const updateMediaSession = (song: Song | null) => {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  if (!song) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    return;
  }
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
  lyricsOpen: false,
};

// Track failed tracks in the current playback session to prevent infinite loops
const failedTracks = new Set<string>();

const handlePlaybackError = (failedSong: Song | null) => {
  if (!failedSong) {
    usePlayerStore.setState({ isPlaying: false, isLoading: false });
    return;
  }

  failedTracks.add(failedSong._id);
  const { queue, currentIndex, repeat } = usePlayerStore.getState();

  // Search for the next available playable song in the queue that hasn't failed
  let nextCandidateIndex = -1;
  const total = queue.length;

  for (let offset = 1; offset < total; offset++) {
    const candidateIdx = (currentIndex + offset) % total;
    if (currentIndex + offset >= total && repeat !== "all") {
      break;
    }
    const candidate = queue[candidateIdx];
    if (candidate && candidate.songUrl && !failedTracks.has(candidate._id)) {
      nextCandidateIndex = candidateIdx;
      break;
    }
  }

  if (nextCandidateIndex !== -1) {
    const nextSong = queue[nextCandidateIndex];
    toast.error(`"${failedSong.title}" is unavailable. Skipping...`);
    usePlayerStore.setState({
      currentIndex: nextCandidateIndex,
      currentSong: nextSong,
      isLoading: true,
    });
    void startAudio(nextSong);
    updateMediaSession(nextSong);
  } else {
    // No more playable songs in queue
    audioEngine.stop();
    usePlayerStore.setState({ isPlaying: false, isLoading: false });
    toast.error("No playable songs remaining in queue");
  }
};

const startAudio = async (song: Song) => {
  if (!song || !song.songUrl) {
    handlePlaybackError(song);
    return;
  }

  usePlayerStore.setState({ isLoading: true });
  try {
    const crossfade = usePlayerStore.getState().crossfade;
    await audioEngine.playUrl(song.songUrl, { autoplay: true, crossfadeMs: crossfade });
  } catch (error) {
    console.error("Failed to start audio for song:", song.title, error);
    handlePlaybackError(song);
  }
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initializeQueue: (songs: Song[]) => {
        if (!Array.isArray(songs) || songs.length === 0) return;
        failedTracks.clear();
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

        failedTracks.clear();
        const validSongs = songs.filter((s) => s && s.songUrl);
        if (validSongs.length === 0) {
          toast.error("No playable songs in this selection");
          return;
        }

        const safeIndex = Math.min(Math.max(startIndex, 0), validSongs.length - 1);
        const selected = validSongs[safeIndex];

        if (get().shuffle) {
          const rest = validSongs.filter((_, idx) => idx !== safeIndex);
          const shuffled = [selected, ...shuffleArray(rest)];
          set({
            queue: shuffled,
            originalQueue: validSongs,
            currentIndex: 0,
            currentSong: selected,
          });
          void startAudio(selected);
          updateMediaSession(selected);
          return;
        }

        set({
          queue: validSongs,
          originalQueue: validSongs,
          currentIndex: safeIndex,
          currentSong: selected,
        });
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

        if (!song || !song.songUrl) {
          toast.error("This song is unavailable");
          return;
        }

        failedTracks.delete(song._id);
        const { queue } = get();
        let index = queue.findIndex((item) => item._id === song._id);

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
          if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "paused";
          }
        } else {
          void audioEngine.play().then(() => {
            set({ isPlaying: true });
            if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
              navigator.mediaSession.playbackState = "playing";
            }
          }).catch((err) => {
            console.error("Playback toggle error", err);
          });
        }
      },

      playNext: (fromEnded = false) => {
        const { queue, currentIndex, repeat } = get();
        if (queue.length === 0) return;

        // If repeat one and naturally ended, replay current track
        if (repeat === "one" && fromEnded) {
          const current = get().currentSong;
          if (current && !failedTracks.has(current._id)) {
            audioEngine.seek(0);
            void audioEngine.play();
            set({ isPlaying: true });
            updateMediaSession(current);
            return;
          }
        }

        let nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeat === "all") {
            nextIndex = 0;
          } else {
            audioEngine.stop();
            set({ isPlaying: false });
            updateMediaSession(null);
            return;
          }
        }

        // Look for the next playable unfailed track
        let targetIndex = -1;
        const total = queue.length;
        for (let i = 0; i < total; i++) {
          const checkIndex = (nextIndex + i) % total;
          if (nextIndex + i >= total && repeat !== "all") break;
          const candidate = queue[checkIndex];
          if (candidate && candidate.songUrl && !failedTracks.has(candidate._id)) {
            targetIndex = checkIndex;
            break;
          }
        }

        if (targetIndex !== -1) {
          const nextSong = queue[targetIndex];
          set({ currentIndex: targetIndex, currentSong: nextSong });
          void startAudio(nextSong);
          updateMediaSession(nextSong);
        } else {
          audioEngine.stop();
          set({ isPlaying: false, isLoading: false });
          toast.error("No playable songs remaining in queue");
        }
      },

      playPrevious: () => {
        const { queue, currentIndex, repeat } = get();
        if (queue.length === 0) return;

        // If current song played > 3 seconds, replay from beginning
        if (audioEngine.getCurrentTime() > 3) {
          audioEngine.seek(0);
          return;
        }

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          if (repeat === "all") prevIndex = queue.length - 1;
          else prevIndex = 0;
        }

        // Search for previous playable song
        let targetIndex = -1;
        const total = queue.length;
        for (let i = 0; i < total; i++) {
          let checkIndex = prevIndex - i;
          if (checkIndex < 0) {
            if (repeat === "all") checkIndex = (checkIndex + total) % total;
            else break;
          }
          const candidate = queue[checkIndex];
          if (candidate && candidate.songUrl && !failedTracks.has(candidate._id)) {
            targetIndex = checkIndex;
            break;
          }
        }

        if (targetIndex !== -1) {
          const prevSong = queue[targetIndex];
          set({ currentIndex: targetIndex, currentSong: prevSong });
          void startAudio(prevSong);
          updateMediaSession(prevSong);
        } else {
          audioEngine.seek(0);
        }
      },

      seek: (seconds: number) => {
        audioEngine.seek(seconds);
      },

      toggleShuffle: () => {
        set((s) => {
          const shuffle = !s.shuffle;
          if (shuffle && s.currentSong) {
            const rest = s.queue.filter((q) => q._id !== s.currentSong?._id);
            const shuffled = [s.currentSong, ...shuffleArray(rest)];
            const idx = shuffled.findIndex((q) => q._id === s.currentSong?._id);
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
        if (!song || !song.songUrl) return;
        set((s) => ({
          queue: [...s.queue, song],
          originalQueue: s.originalQueue.some((item) => item._id === song._id)
            ? s.originalQueue
            : [...s.originalQueue, song],
        }));
      },

      playNextInQueue: (song: Song) => {
        if (!song || !song.songUrl) return;
        const { currentIndex, currentSong } = get();
        if (!currentSong) {
          get().playSong(song);
          return;
        }
        set((s) => {
          const filtered = s.queue.filter(
            (_, idx) => !(s.queue[idx]._id === song._id && idx > currentIndex)
          );
          const insertAt = Math.max(currentIndex + 1, 0);
          const nextQueue = [...filtered];
          nextQueue.splice(insertAt, 0, song);
          return {
            queue: nextQueue,
            originalQueue: s.originalQueue.some((item) => item._id === song._id)
              ? s.originalQueue
              : [...s.originalQueue, song],
          };
        });
      },

      removeFromQueue: (index: number) => {
        const { queue, currentIndex } = get();
        if (index < 0 || index >= queue.length) return;
        const nextQueue = queue.filter((_, itemIndex) => itemIndex !== index);
        if (index === currentIndex) {
          if (nextQueue.length === 0) {
            audioEngine.stop();
            set({ queue: [], currentSong: null, currentIndex: -1, isPlaying: false });
            return;
          }
          const replacement = nextQueue[Math.min(index, nextQueue.length - 1)];
          set({
            queue: nextQueue,
            currentIndex: Math.min(index, nextQueue.length - 1),
            currentSong: replacement,
          });
          void startAudio(replacement);
          updateMediaSession(replacement);
          return;
        }
        set({
          queue: nextQueue,
          currentIndex: index < currentIndex ? currentIndex - 1 : currentIndex,
        });
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

      toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen })),
      setQueueOpen: (open: boolean) => set({ queueOpen: open }),
      toggleLyrics: () => set((s) => ({ lyricsOpen: !s.lyricsOpen })),
      setLyricsOpen: (open: boolean) => set({ lyricsOpen: open }),
    }),
    {
      name: "soundwave-player-settings",
      partialize: (persistState) => ({
        volume: persistState.volume,
        muted: persistState.muted,
        repeat: persistState.repeat,
        shuffle: persistState.shuffle,
        crossfade: persistState.crossfade,
        eq: persistState.eq,
      }),
      onRehydrateStorage: () => (rehydratedState) => {
        if (!rehydratedState) return;
        try {
          audioEngine.setVolume(rehydratedState.volume ?? 0.7);
          audioEngine.setMuted(rehydratedState.muted ?? false);
          audioEngine.setCrossfade(rehydratedState.crossfade ?? 0);
          audioEngine.setEq(rehydratedState.eq ?? { bass: 0, mid: 0, treble: 0 });
        } catch {
          // ignore
        }
      },
    }
  )
);

// Event Bindings between AudioEngine and PlayerStore
audioEngine.on("time", ({ currentTime, duration, buffered }) => {
  usePlayerStore.setState({ progress: currentTime, duration, buffered });
});

audioEngine.on("play", () => {
  usePlayerStore.setState({ isPlaying: true, isLoading: false });
  if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "playing";
  }
});

audioEngine.on("pause", () => {
  usePlayerStore.setState({ isPlaying: false });
  if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "paused";
  }
});

audioEngine.on("ended", () => {
  usePlayerStore.getState().playNext(true);
});

audioEngine.on("loading", ({ loading }) => {
  usePlayerStore.setState({ isLoading: loading });
});

audioEngine.on("error", () => {
  const currentSong = usePlayerStore.getState().currentSong;
  handlePlaybackError(currentSong);
});

audioEngine.on("graph", ({ mode }) => {
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
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (typeof details.seekTime === "number") usePlayerStore.getState().seek(details.seekTime);
  });
}
