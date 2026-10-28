import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { audioEngine } from "@/lib/audioEngine";
import type { Song } from "@/types";

const mockSongs: Song[] = [
  {
    _id: "song-1",
    title: "Track One",
    artist: "Artist One",
    imageUrl: "/img1.jpg",
    songUrl: "https://example.com/song1.mp3",
    duration: 180,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    albumId: null,
  },
  {
    _id: "song-2",
    title: "Track Two (Broken)",
    artist: "Artist Two",
    imageUrl: "/img2.jpg",
    songUrl: "https://example.com/broken-404.mp3",
    duration: 200,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    albumId: null,
  },
  {
    _id: "song-3",
    title: "Track Three",
    artist: "Artist Three",
    imageUrl: "/img3.jpg",
    songUrl: "https://example.com/song3.mp3",
    duration: 220,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    albumId: null,
  },
];

describe("usePlayerStore Playback & Queue Management", () => {
  beforeEach(() => {
    // Authenticate user for playback
    useAuthStore.setState({ user: { _id: "user-1", fullName: "Test User", imageUrl: "" } as unknown as import("@/types").User });

    // Reset player store
    usePlayerStore.setState({
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      currentSong: null,
      isPlaying: false,
      isLoading: false,
      repeat: "off",
      shuffle: false,
    });

    vi.spyOn(audioEngine, "playUrl").mockImplementation(async (url: string) => {
      if (url.includes("broken")) {
        throw new Error("404 Not Found");
      }
    });
    vi.spyOn(audioEngine, "play").mockImplementation(async () => {});
    vi.spyOn(audioEngine, "pause").mockImplementation(() => {});
    vi.spyOn(audioEngine, "stop").mockImplementation(() => {});
    vi.spyOn(audioEngine, "seek").mockImplementation(() => {});
  });

  it("should initialize queue properly", () => {
    usePlayerStore.getState().initializeQueue(mockSongs);
    const state = usePlayerStore.getState();
    expect(state.queue.length).toBe(3);
    expect(state.currentSong?._id).toBe("song-1");
    expect(state.currentIndex).toBe(0);
  });

  it("should play a selection of songs at a specific index", () => {
    usePlayerStore.getState().playSongs(mockSongs, 0);
    const state = usePlayerStore.getState();
    expect(state.currentSong?._id).toBe("song-1");
    expect(state.currentIndex).toBe(0);
  });

  it("should skip unavailable track and advance to next valid song instead of replaying previous song", async () => {
    // Start with track 1
    usePlayerStore.getState().playSongs(mockSongs, 0);
    expect(usePlayerStore.getState().currentSong?._id).toBe("song-1");

    // Click Next: track 2 is broken, it must gracefully advance to track 3 and NOT replay track 1
    usePlayerStore.getState().playNext(false);

    // Let the async error recovery resolve
    await new Promise((resolve) => setTimeout(resolve, 50));

    const state = usePlayerStore.getState();
    expect(state.currentSong?._id).toBe("song-3");
    expect(state.currentIndex).toBe(2);
  });

  it("should stop cleanly if all remaining songs in the queue are unavailable without looping", async () => {
    const brokenList: Song[] = [
      { ...mockSongs[1], _id: "b1" },
      { ...mockSongs[1], _id: "b2" },
    ];

    usePlayerStore.getState().playSongs(brokenList, 0);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const state = usePlayerStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(audioEngine.stop).toHaveBeenCalled();
  });

  it("should repeat track when repeat mode is 'one' only upon natural song completion (fromEnded)", () => {
    usePlayerStore.getState().playSongs(mockSongs, 0);
    usePlayerStore.setState({ repeat: "one" });

    // When song naturally finishes (fromEnded = true)
    usePlayerStore.getState().playNext(true);
    expect(usePlayerStore.getState().currentSong?._id).toBe("song-1");

    // But when user clicks Next button (fromEnded = false), it should advance!
    usePlayerStore.getState().playNext(false);
    expect(usePlayerStore.getState().currentIndex).toBeGreaterThan(0);
  });

  it("should handle shuffle without stopping the currently active track", () => {
    usePlayerStore.getState().playSongs(mockSongs, 0);
    const activeSong = usePlayerStore.getState().currentSong;

    usePlayerStore.getState().toggleShuffle();
    const state = usePlayerStore.getState();

    expect(state.shuffle).toBe(true);
    // Active track must remain playing and intact at the top
    expect(state.currentSong?._id).toBe(activeSong?._id);
    expect(state.queue.length).toBe(3);
  });

  it("should manage queue addition and removal accurately", () => {
    usePlayerStore.getState().playSongs([mockSongs[0]], 0);
    expect(usePlayerStore.getState().queue.length).toBe(1);

    usePlayerStore.getState().addToQueue(mockSongs[2]);
    expect(usePlayerStore.getState().queue.length).toBe(2);

    usePlayerStore.getState().removeFromQueue(1);
    expect(usePlayerStore.getState().queue.length).toBe(1);
  });

  it("should manage audio and playback DSP settings with studio precision", () => {
    const store = usePlayerStore.getState();

    // EQ Preset selection
    store.setEqPreset("Bass Boost");
    expect(usePlayerStore.getState().eq.preset).toBe("Bass Boost");
    expect(usePlayerStore.getState().eq.bass).toBe(7);

    // EQ Toggle bypass
    store.toggleEq();
    expect(usePlayerStore.getState().eq.enabled).toBe(false);
    store.toggleEq();
    expect(usePlayerStore.getState().eq.enabled).toBe(true);

    // Playback rate
    store.setPlaybackRate(1.25);
    expect(usePlayerStore.getState().playbackRate).toBe(1.25);

    // Stereo pan and normalization
    store.setStereoPan(0.5);
    expect(usePlayerStore.getState().stereoPan).toBe(0.5);

    store.setNormalizeVolume(true);
    expect(usePlayerStore.getState().normalizeVolume).toBe(true);

    store.setAudioQuality("lossless");
    expect(usePlayerStore.getState().audioQuality).toBe("lossless");

    // Reset all settings
    store.resetAudioSettings();
    const resetState = usePlayerStore.getState();
    expect(resetState.playbackRate).toBe(1.0);
    expect(resetState.stereoPan).toBe(0);
    expect(resetState.normalizeVolume).toBe(false);
    expect(resetState.eq.preset).toBe("Flat");
    expect(resetState.eq.bass).toBe(0);
    expect(resetState.audioQuality).toBe("high");
  });
});
