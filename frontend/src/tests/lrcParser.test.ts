import { describe, it, expect } from "vitest";
import { parseLrc, getActiveLyricIndex } from "@/lib/lrcParser";

describe("LRC Parser & Synchronized Lyrics Engine", () => {
  const sampleLrc = `
[ti:Attention]
[ar:Charlie Puth]
[00:04.23] Whoa-oh, mm-hmm-mm
[00:09.37] You've been runnin' 'round, runnin' 'round, runnin' 'round throwin' that dirt all on my name
[00:14.16] 'Cause you knew that I'd, knew that I'd, knew that I'd call you up, ah
[00:18.96] You've been goin' 'round, goin' 'round, goin' 'round every party in LA
  `;

  it("should parse standard LRC timestamps and text chronologically", () => {
    const lines = parseLrc(sampleLrc);

    expect(lines.length).toBe(4);
    expect(lines[0].time).toBeCloseTo(4.23, 2);
    expect(lines[0].text).toBe("Whoa-oh, mm-hmm-mm");
    expect(lines[1].time).toBeCloseTo(9.37, 2);
    expect(lines[2].time).toBeCloseTo(14.16, 2);
    expect(lines[3].time).toBeCloseTo(18.96, 2);
  });

  it("should ignore metadata tags and empty lines", () => {
    const lines = parseLrc("[ar:Artist]\n[al:Album]\n\n\n[00:01.00] Real line");
    expect(lines.length).toBe(1);
    expect(lines[0].text).toBe("Real line");
    expect(lines[0].time).toBe(1);
  });

  it("should accurately determine the active verse index based on playback progress", () => {
    const lines = parseLrc(sampleLrc);

    // Before any line starts
    expect(getActiveLyricIndex(lines, 1.0)).toBe(-1);

    // On line 0 (at 4.23 seconds)
    expect(getActiveLyricIndex(lines, 4.5)).toBe(0);

    // On line 1 (at 9.37 seconds)
    expect(getActiveLyricIndex(lines, 10.0)).toBe(1);

    // On line 3 (at 18.96 seconds)
    expect(getActiveLyricIndex(lines, 20.0)).toBe(3);
  });

  it("should return empty array for empty or invalid input", () => {
    expect(parseLrc("")).toEqual([]);
    // @ts-expect-error testing invalid input
    expect(parseLrc(null)).toEqual([]);
  });
});
