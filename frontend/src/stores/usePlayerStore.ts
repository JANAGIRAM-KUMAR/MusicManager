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
  return [
    { src: song.imageUrl, sizes: "512x512", type: "image/jpeg" },
  ];
};

const updateMediaSession = (song: Song) => {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    album: song.albumId ? "Album" : "Single",
    artwork: songArtwork(song),
  });
  navigator.mediaSession.playbackState = "playing";
};

const updatePositionState = (
  duration: number,
  position: number,
  playbackRate = 1
) => {
  if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) {
    return;
  }
  if (!Number.isFinite(duration) || duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate,
      position: Math.min(Math.max(position, 0), duration),
    });
  } catch {
    // Some browsers reject position updates while the media is not ready.
  }
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => {
      const startSong = (song: Song, index: number) => {
        const previous = get().currentSong;
        set({
          currentSong: song,
          currentIndex: index,
          isPlaying: true,
          isLoading: true,
          progress: 0,
          duration: song.duration || 0,
        });

        if (previous?._id !== song._id) updateMediaSession(song);

        void audioEngine
          .playUrl(song.songUrl, {
            autoplay: true,
            crossfadeMs: get().crossfade,
          })
          .then(() => {
            if (get().currentSong?._id !== song._id) return;
            const { queue, currentIndex } = get();
            const nextSong = queue[currentIndex + 1];
            if (nextSong && nextSong._id !== song._id) {
              try {
                audioEngine.preload(nextSong.songUrl);
              } catch {
                // ignore
              }
            }
          })
          .catch((err) => {
            console.error("Playback error:", err);
            set({ isPlaying: false, isLoading: false });
            if (!("mediaSession" in navigator)) return;
            try {
              navigator.mediaSession.playbackState = "paused";
            } catch {
              // ignore
            }
            toast.error("Failed to play this track");
          });
      };

      return {
        queue: [],
        originalQueue: [],
        currentIndex: -1,
        currentSong: null,

        isPlaying: false,
        isLoading: false,
        progress: 0,
        duration: 0,
        buffered: 0,

        volume: 0.7,
        muted: false,
        repeat: "off",
        shuffle: false,
        crossfade: 2000,
        eq: { bass: 0, mid: 0, treble: 0 },
        graphMode: "element",
        queueOpen: false,

        initializeQueue: (songs: Song[]) => {
          if (songs.length === 0) return;
          const { currentSong } = get();
          const existingIndex = currentSong
            ? songs.findIndex((song) => song._id === currentSong._id)
            : -1;

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
        if (!songs || songs.length === 0) {
          toast.error("No songs available to play");
          return;
        }
        const validSongs = songs.filter((s) => s && s.songUrl);
        if (validSongs.length === 0) {
          toast.error("No playable songs in this selection");
          return;
        }
        const safeIndex = Math.min(Math.max(startIndex, 0), validSongs.length - 1);
        const selected = validSongs[safeIndex];

        if (get().shuffle) {
          const rest = validSongs.filter((_, index) => index !== safeIndex);
          const shuffled = [selected, ...shuffleArray(rest)];
          set({ queue: shuffled, originalQueue: validSongs, currentIndex: 0 });
          startSong(selected, 0);
          return;
        }

        set({ queue: validSongs, originalQueue: validSongs, currentIndex: safeIndex });
        startSong(selected, safeIndex);
      },

        playSong: (song: Song) => {
          const authUser = useAuthStore.getState().user;
          if (!authUser) {
            toast.error("Log in to listen");
            useAuthStore.getState().openSignIn?.();
            return;
          }
          const { queue, currentIndex } = get();

          let index = queue.findIndex((item) => item._id === song._id);
          if (index === -1) {
            const insertAt =
              currentIndex >= 0 ? Math.min(currentIndex + 1, queue.length) : queue.length;
            const nextQueue = [...queue];
            nextQueue.splice(insertAt, 0, song);
            set({
              queue: nextQueue,
              originalQueue: [...get().originalQueue, song],
            });
            index = insertAt;
          }
          startSong(song, index);
        },

        setCurrentSong: (song: Song | null) => {
          if (!song) return;
          get().playSong(song);
        },

        togglePlay: () => {
          const { currentSong, queue, currentIndex, isPlaying } = get();

          if (!currentSong) {
            const first = queue[Math.max(currentIndex, 0)] || queue[0];
            if (first) {
              startSong(first, queue.findIndex((s) => s._id === first._id) >= 0 ? queue.findIndex((s) => s._id === first._id) : 0);
            }
            return;
          }

          if (!audioEngine.hasSource()) {
            startSong(currentSong, Math.max(currentIndex, 0));
            return;
          }

          if (isPlaying) {
            audioEngine.pause();
            set({ isPlaying: false });
            if ("mediaSession" in navigator) {
              navigator.mediaSession.playbackState = "paused";
            }
          } else {
            const { progress, duration } = get();
            if (duration > 0 && progress >= duration - 0.25) {
              audioEngine.seek(0);
              set({ progress: 0 });
            }
            set({ isPlaying: true });
            void audioEngine.play().catch(() => {
              set({ isPlaying: false });
            });
            if ("mediaSession" in navigator) {
              navigator.mediaSession.playbackState = "playing";
            }
          }
        },

        playNext: (fromEnded = false) => {
          const { queue, currentIndex, repeat } = get();
          if (queue.length === 0) return;

          if (repeat === "one" && fromEnded) {
            const current = queue[currentIndex];
            if (current) {
              audioEngine.seek(0);
              set({ progress: 0, isPlaying: true });
              void audioEngine.play();
            }
            return;
          }

          const nextIndex = currentIndex + 1;
          if (nextIndex >= queue.length) {
            if (repeat === "all") {
              startSong(queue[0], 0);
            } else {
              audioEngine.pause();
              set({ isPlaying: false, isLoading: false, progress: get().duration });
              if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = "none";
              }
            }
            return;
          }

          startSong(queue[nextIndex], nextIndex);
        },

        playPrevious: () => {
          const { queue, currentIndex, progress, repeat } = get();
          if (queue.length === 0) return;

          if (progress > 3) {
            audioEngine.seek(0);
            set({ progress: 0 });
            return;
          }

          if (currentIndex <= 0) {
            if (repeat === "all") {
              startSong(queue[queue.length - 1], queue.length - 1);
            } else {
              audioEngine.seek(0);
              set({ progress: 0 });
            }
            return;
          }

          startSong(queue[currentIndex - 1], currentIndex - 1);
        },

        seek: (seconds: number) => {
          audioEngine.seek(seconds);
          set({ progress: seconds });
          updatePositionState(get().duration, seconds);
        },

        toggleShuffle: () => {
          const { shuffle, queue, originalQueue, currentSong, currentIndex } = get();
          const base = originalQueue.length > 0 ? originalQueue : queue;

          if (shuffle) {
            const restored = base.length > 0 ? base : queue;
            const index = currentSong
              ? restored.findIndex((song) => song._id === currentSong._id)
              : -1;
            set({
              shuffle: false,
              queue: restored,
              originalQueue: restored,
              currentIndex: index === -1 ? Math.max(currentIndex, 0) : index,
            });
            return;
          }

          if (queue.length === 0) {
            set({ shuffle: true });
            return;
          }

          const current = currentSong ?? queue[currentIndex] ?? queue[0];
          const rest = queue.filter((song) => song._id !== current?._id);
          set({
            shuffle: true,
            queue: current ? [current, ...shuffleArray(rest)] : shuffleArray(queue),
            originalQueue: base,
            currentIndex: 0,
          });
        },

        cycleRepeat: () => {
          const order: RepeatMode[] = ["off", "all", "one"];
          const current = get().repeat;
          const next = order[(order.indexOf(current) + 1) % order.length];
          set({ repeat: next });
        },

        addToQueue: (song: Song) => {
          const state = get();
          // Allow duplicates? Better allow same song multiple times but avoid exact duplicates? Spotify allows adding same song again
          // Just append
          set((s) => ({
            queue: [...s.queue, song],
            originalQueue: s.originalQueue.some((item) => item._id === song._id)
              ? s.originalQueue
              : [...s.originalQueue, song],
          }));
          const newState = get();
          if (!newState.currentSong && newState.queue.length > 0) {
            set({ currentIndex: 0 });
            startSong(song, newState.queue.length - 1);
          }
        },

        playNextInQueue: (song: Song) => {
          const { queue, currentIndex, currentSong } = get();
          if (!currentSong) {
            get().playSong(song);
            return;
          }
          // Remove existing occurrence and insert next
          const filtered = queue.filter((_, idx) => !(queue[idx]._id === song._id && idx > currentIndex));
          const insertAt = Math.max(currentIndex + 1, 0);
          const nextQueue = [...filtered];
          nextQueue.splice(insertAt, 0, song);
          set({
            queue: nextQueue,
            originalQueue: get().originalQueue.some((item) => item._id === song._id)
              ? get().originalQueue
              : [...get().originalQueue, song],
          });
        },

        removeFromQueue: (index: number) => {
          const { queue, currentIndex } = get();
          if (index < 0 || index >= queue.length) return;
          const nextQueue = queue.filter((_, itemIndex) => itemIndex !== index);
          const nextOriginal = get().originalQueue.filter(
            (song) => song._id !== queue[index]._id
          );

          if (index === currentIndex) {
            set({
              queue: nextQueue,
              originalQueue: nextOriginal,
              currentIndex: Math.min(index, nextQueue.length - 1),
            });
            const replacement = nextQueue[Math.min(index, nextQueue.length - 1)];
            if (replacement) {
              startSong(replacement, Math.min(index, nextQueue.length - 1));
            } else {
              audioEngine.pause();
              set({ currentSong: null, currentIndex: -1, isPlaying: false });
            }
            return;
          }

          set({
            queue: nextQueue,
            originalQueue: nextOriginal,
            currentIndex: index < currentIndex ? currentIndex - 1 : currentIndex,
          });
        },

        clearQueue: () => {
          const current = get().currentSong;
          set({
            queue: current ? [current] : [],
            originalQueue: current ? [current] : [],
            currentIndex: current ? 0 : -1,
          });
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

        toggleQueue: () => set((state) => ({ queueOpen: !state.queueOpen })),
        setQueueOpen: (open: boolean) => set({ queueOpen: open }),
      };
    },
    {
      name: "soundwave-player-settings",
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        repeat: state.repeat,
        shuffle: state.shuffle,
        crossfade: state.crossfade,
        eq: state.eq,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        audioEngine.setVolume(state.volume);
        audioEngine.setMuted(state.muted);
        audioEngine.setCrossfade(state.crossfade);
        audioEngine.setEq(state.eq);
      },
    }
  )
);

audioEngine.on("time", ({ currentTime, duration, buffered }) => {
  usePlayerStore.setState((state) => ({
    progress: currentTime,
    duration: duration > 0 ? duration : state.duration,
    buffered,
  }));
  updatePositionState(duration, currentTime);
});

audioEngine.on("duration", ({ duration }) => {
  if (duration > 0) usePlayerStore.setState({ duration });
});

audioEngine.on("play", () => {
  usePlayerStore.setState({ isPlaying: true, isLoading: false });
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
});

audioEngine.on("pause", () => {
  usePlayerStore.setState({ isPlaying: false, isLoading: false });
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
});

audioEngine.on("loading", ({ loading }) => {
  usePlayerStore.setState({ isLoading: loading });
});

audioEngine.on("ended", () => {
  usePlayerStore.getState().playNext(true);
});

audioEngine.on("error", ({ message }) => {
  usePlayerStore.setState({ isPlaying: false, isLoading: false });
  console.warn("Audio engine error:", message);
  toast.error(message || "Playback failed");
});

audioEngine.on("graph", ({ mode }) => {
  usePlayerStore.setState({ graphMode: mode });
});

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => {
    const state = usePlayerStore.getState();
    if (!state.isPlaying) state.togglePlay();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    const state = usePlayerStore.getState();
    if (state.isPlaying) state.togglePlay();
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    usePlayerStore.getState().playNext();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    usePlayerStore.getState().playPrevious();
  });
  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    const state = usePlayerStore.getState();
    state.seek(Math.max(0, state.progress - (details.seekOffset ?? 10)));
  });
  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    const state = usePlayerStore.getState();
    state.seek(Math.min(state.duration, state.progress + (details.seekOffset ?? 10)));
  });
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (typeof details.seekTime === "number") {
      usePlayerStore.getState().seek(details.seekTime);
    }
  });
}
