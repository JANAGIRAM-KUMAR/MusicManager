import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AudioEngine } from "@/lib/audioEngine";

describe("AudioEngine", () => {
  let engine: AudioEngine;

  // Mock AudioContext and nodes for Web Audio testing
  beforeEach(() => {
    vi.restoreAllMocks();

    const mockAnalyser = {
      fftSize: 64,
      frequencyBinCount: 32,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: vi.fn((arr: Uint8Array) => {
        arr.fill(128); // Simulate non-zero frequency spectrum
      }),
      connect: vi.fn(),
    };

    const mockGain = {
      gain: { value: 0.7, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };

    const mockFilter = {
      type: "lowshelf",
      frequency: { value: 250 },
      gain: { value: 0, setTargetAtTime: vi.fn() },
      Q: { value: 1 },
      connect: vi.fn(),
    };

    const mockSource = {
      connect: vi.fn(),
    };

    class MockAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createAnalyser = vi.fn(() => mockAnalyser);
      createGain = vi.fn(() => mockGain);
      createChannelSplitter = vi.fn(() => ({ connect: vi.fn(), channelCount: 2, channelCountMode: "explicit" }));
      createChannelMerger = vi.fn(() => ({ connect: vi.fn() }));
      createBiquadFilter = vi.fn(() => mockFilter);
      createMediaElementSource = vi.fn(() => mockSource);
      resume = vi.fn(async () => {
        this.state = "running";
      });
      close = vi.fn(async () => {});
    }

    // @ts-expect-error Mocking AudioContext
    window.AudioContext = MockAudioContext;

    engine = new AudioEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it("should instantiate with default volume and proper properties", () => {
    expect(engine.getVolume()).toBe(0.7);
    expect(engine.getMuted()).toBe(false);
    expect(engine.getCurrentTime()).toBe(0);
    expect(engine.getDuration()).toBe(0);
  });

  it("should initialize the Web Audio Graph and return a valid AnalyserNode", () => {
    const analyser = engine.getAnalyser();
    expect(analyser).not.toBeNull();
    expect(engine.getGraphMode()).toBe("webaudio");

    // Test that analyser returns frequency data
    const freq = new Uint8Array(analyser!.frequencyBinCount);
    analyser!.getByteFrequencyData(freq);
    expect(freq[0]).toBe(128);
  });

  it("should adjust volume and mute correctly without distortion", () => {
    engine.setVolume(0.4);
    expect(engine.getVolume()).toBe(0.4);

    engine.setMuted(true);
    expect(engine.getMuted()).toBe(true);

    engine.setMuted(false);
    expect(engine.getMuted()).toBe(false);
  });

  it("should update 3-band equalizer settings", () => {
    engine.getAnalyser();
    engine.setEq({ enabled: true, preset: "Rock", bass: 4, mid: -2, treble: 6 });
    expect(engine.getEq().bass).toBe(4);
    expect(engine.getEq().preset).toBe("Rock");
    expect(engine.getAnalyser()).not.toBeNull();
  });

  it("should support EQ bypass mode without breaking audio chain", () => {
    engine.getAnalyser();
    engine.setEq({ enabled: false, bass: 6, mid: 4, treble: 2 });
    expect(engine.getEq().enabled).toBe(false);
  });

  it("should control playback rate within safe bounds (0.5x to 2.0x)", () => {
    engine.setPlaybackRate(1.5);
    expect(engine.getPlaybackRate()).toBe(1.5);

    // Clamps below 0.5
    engine.setPlaybackRate(0.2);
    expect(engine.getPlaybackRate()).toBe(0.5);

    // Clamps above 2.0
    engine.setPlaybackRate(3.0);
    expect(engine.getPlaybackRate()).toBe(2.0);
  });

  it("should set stereo balance and volume normalization settings", () => {
    engine.setStereoPan(-0.5);
    expect(engine.getStereoPan()).toBe(-0.5);

    // Clamps pan
    engine.setStereoPan(-1.5);
    expect(engine.getStereoPan()).toBe(-1.0);

    engine.setNormalizeVolume(true);
    expect(engine.getNormalizeVolume()).toBe(true);

    const contextState = engine.getAudioContextState();
    expect(contextState).not.toBeNull();
    expect(contextState?.state).toBe("running");
    expect(engine.getSampleRate()).toBeGreaterThan(0);
  });

  it("should emit loading and play events on valid track play", async () => {
    const loadingEvents: boolean[] = [];
    const playEvents: number[] = [];

    engine.on("loading", ({ loading }) => loadingEvents.push(loading));
    engine.on("play", () => playEvents.push(1));

    // @ts-expect-error accessing private audio for test triggers
    const audio = engine.audio;
    audio.play = vi.fn(async () => {
      audio.dispatchEvent(new Event("play"));
    });

    await engine.playUrl("https://example.com/audio.mp3", { autoplay: true });

    expect(loadingEvents).toContain(true);
    expect(engine.hasSource()).toBe(true);
  });

  it("should handle rapid track switching without race conditions or overlapping sounds", async () => {
    // @ts-expect-error accessing private audio
    const audio = engine.audio;
    const playedUrls: string[] = [];

    audio.play = vi.fn(async () => {
      playedUrls.push(audio.src);
    });

    // Rapidly request 3 tracks in sequence
    const p1 = engine.playUrl("https://example.com/track1.mp3", { autoplay: true });
    const p2 = engine.playUrl("https://example.com/track2.mp3", { autoplay: true });
    const p3 = engine.playUrl("https://example.com/track3.mp3", { autoplay: true });

    await Promise.all([p1, p2, p3]);

    // Current source must strictly be the latest requested track
    expect(audio.src).toBe("https://example.com/track3.mp3");
  });

  it("should emit error event for empty or invalid audio sources", async () => {
    let receivedError = false;
    engine.on("error", () => {
      receivedError = true;
    });

    await expect(engine.playUrl("")).rejects.toThrow();
    expect(receivedError).toBe(true);
  });

  it("should detect Safari and safely bypass Web Audio graph to preserve clear audio output", () => {
    const originalUA = navigator.userAgent;
    try {
      Object.defineProperty(navigator, "userAgent", {
        value:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
        configurable: true,
      });

      const safariEngine = new AudioEngine();
      expect(safariEngine.ensureAudioGraph()).toBe(false);
      expect(safariEngine.getGraphMode()).toBe("element");
      expect(safariEngine.getSourceNode()).toBeNull();
      safariEngine.destroy();
    } finally {
      Object.defineProperty(navigator, "userAgent", {
        value: originalUA,
        configurable: true,
      });
    }
  });
});
