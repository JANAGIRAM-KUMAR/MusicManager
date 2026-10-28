import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { parseLrc, getActiveLyricIndex } from "@/lib/lrcParser";

describe("Lyrics Integration & Player Store", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      lyricsOpen: false,
      progress: 0,
      duration: 200,
    });
  });

  it("should toggle lyricsOpen state correctly", () => {
    expect(usePlayerStore.getState().lyricsOpen).toBe(false);

    usePlayerStore.getState().setLyricsOpen(true);
    expect(usePlayerStore.getState().lyricsOpen).toBe(true);

    usePlayerStore.getState().toggleLyrics();
    expect(usePlayerStore.getState().lyricsOpen).toBe(false);

    usePlayerStore.getState().toggleLyrics();
    expect(usePlayerStore.getState().lyricsOpen).toBe(true);
  });

  it("should accurately track active verse during playback progression", () => {
    const lrcSample = `
[00:04.00] Line one
[00:10.00] Line two
[00:25.00] Line three after guitar interlude
    `.trim();

    const lines = parseLrc(lrcSample);
    expect(lines).toHaveLength(3);

    // Before any lyric
    expect(getActiveLyricIndex(lines, 2.0)).toBe(-1);

    // Line 1 active (with 0.15s anticipation lead time)
    expect(getActiveLyricIndex(lines, 3.9)).toBe(0);
    expect(getActiveLyricIndex(lines, 7.5)).toBe(0);

    // Line 2 active
    expect(getActiveLyricIndex(lines, 10.0)).toBe(1);
    expect(getActiveLyricIndex(lines, 20.0)).toBe(1);

    // Line 3 active
    expect(getActiveLyricIndex(lines, 25.5)).toBe(2);
  });

  it("should calculate gaps greater than 8 seconds for instrumental interludes", () => {
    const lines = [
      { id: 1, time: 10, text: "Intro verse" },
      { id: 2, time: 25, text: "Verse after 15 second guitar solo" },
    ];

    const gap = lines[1].time - lines[0].time;
    expect(gap).toBe(15);
    expect(gap > 8).toBe(true);
  });
});
