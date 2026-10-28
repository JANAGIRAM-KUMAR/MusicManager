import type { EqSettings, RepeatMode } from "@/types";

export type { RepeatMode };

export interface AudioEngineTime {
  currentTime: number;
  duration: number;
  buffered: number;
}

interface AudioEngineEventMap {
  time: AudioEngineTime;
  duration: { duration: number };
  play: void;
  pause: void;
  ended: void;
  loading: { loading: boolean };
  error: { message: string; url: string };
  graph: { mode: "webaudio" | "element" };
}

type Listener<K extends keyof AudioEngineEventMap> = (
  payload: AudioEngineEventMap[K]
) => void;

interface PlayOptions {
  autoplay?: boolean;
  crossfadeMs?: number;
}

export const isSafari = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /Safari/i.test(ua) &&
    !/Chrome/i.test(ua) &&
    !/Chromium/i.test(ua) &&
    !/Edg/i.test(ua) &&
    !/Android/i.test(ua)
  );
};

export class AudioEngine {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private _sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  private currentUrl: string | null = null;
  private playRequestId = 0;
  private volume = 0.7;
  private muted = false;
  private crossfadeMs = 0;
  private eqSettings: EqSettings = { bass: 0, mid: 0, treble: 0 };
  private listeners = new Map<keyof AudioEngineEventMap, Set<Listener<never>>>();
  private rafId: number | null = null;
  private isDestroyed = false;
  private isSeeking = false;

  constructor() {
    this.audio = typeof Audio !== "undefined" ? new Audio() : ({} as HTMLAudioElement);
    if (typeof window !== "undefined" && typeof this.audio.addEventListener === "function") {
      this.setupAudioElement();
    }
  }

  private setupAudioElement() {
    // Safari blocks or mutes createMediaElementSource on cross-origin Cloudinary streams (WebKit Bug #213797).
    // For non-Safari browsers (Chrome, Firefox, Edge), enable anonymous CORS for Web Audio analysis.
    if (!isSafari()) {
      this.audio.crossOrigin = "anonymous";
    }
    this.audio.preload = "auto";

    this.audio.addEventListener("timeupdate", () => {
      if (this.isSeeking) return;
      this.emitCurrentTime();
    });

    this.audio.addEventListener("durationchange", () => {
      const duration = this.audio.duration || 0;
      if (!isNaN(duration) && duration > 0) {
        this.emit("duration", { duration });
      }
    });

    this.audio.addEventListener("play", () => {
      this.emit("loading", { loading: false });
      this.emit("play", undefined);
      this.startTimeLoop();
    });

    this.audio.addEventListener("pause", () => {
      if (!this.audio.ended) {
        this.emit("pause", undefined);
      }
      this.stopTimeLoop();
    });

    this.audio.addEventListener("ended", () => {
      this.stopTimeLoop();
      this.emit("ended", undefined);
    });

    this.audio.addEventListener("waiting", () => {
      this.emit("loading", { loading: true });
    });

    this.audio.addEventListener("playing", () => {
      this.emit("loading", { loading: false });
    });

    this.audio.addEventListener("canplay", () => {
      this.emit("loading", { loading: false });
    });

    this.audio.addEventListener("error", () => {
      const error = this.audio.error;
      const message = error
        ? `Audio error code ${error.code}: ${error.message || "Failed to load"}`
        : "Audio error";
      this.stopTimeLoop();
      this.emit("loading", { loading: false });
      this.emit("error", { message, url: this.currentUrl || "" });
    });
  }

  public ensureAudioGraph(): boolean {
    if (this.audioContext && this.analyserNode) {
      return true;
    }
    if (typeof window === "undefined") return false;

    // Safari has a long-standing WebKit bug (#213797) where createMediaElementSource mutes cross-origin audio.
    // Playing directly through the native HTMLAudioElement in Safari ensures 100% reliable, clear audio.
    if (isSafari()) {
      return false;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      const ctx = new AudioCtx();
      this.audioContext = ctx;

      // 3-Band Equalizer Filters
      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 250;
      bass.gain.value = this.eqSettings.bass;
      this.bassFilter = bass;

      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1500;
      mid.Q.value = 1;
      mid.gain.value = this.eqSettings.mid;
      this.midFilter = mid;

      const treble = ctx.createBiquadFilter();
      treble.type = "highshelf";
      treble.frequency.value = 4000;
      treble.gain.value = this.eqSettings.treble;
      this.trebleFilter = treble;

      // Realtime AnalyserNode
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // 32 frequency bins
      analyser.smoothingTimeConstant = 0.8;
      this.analyserNode = analyser;

      // Master Gain
      const gain = ctx.createGain();
      gain.gain.value = this.muted ? 0 : this.volume;
      this.gainNode = gain;

      // Single connection: audio -> bass -> mid -> treble -> analyser -> gain -> destination
      const source = ctx.createMediaElementSource(this.audio);
      this._sourceNode = source;

      source.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);

      this.emit("graph", { mode: "webaudio" });
      return true;
    } catch (e) {
      console.warn("Web Audio graph initialization skipped or unavailable, using native element:", e);
      return false;
    }
  }

  public unlock(): void {
    if (this.audioContext && this.audioContext.state === "suspended") {
      void this.audioContext.resume().catch(() => {});
    }
    if (this.audio && typeof this.audio.load === "function") {
      try {
        this.audio.load();
      } catch {
        // ignore
      }
    }
  }

  public async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch {
        // ignore
      }
    }
  }

  on<K extends keyof AudioEngineEventMap>(
    event: K,
    listener: Listener<K>
  ): () => void {
    const bucket = this.listeners.get(event) ?? new Set<Listener<never>>();
    bucket.add(listener as Listener<never>);
    this.listeners.set(event, bucket);
    return () => {
      bucket.delete(listener as Listener<never>);
    };
  }

  private emit<K extends keyof AudioEngineEventMap>(
    event: K,
    payload: AudioEngineEventMap[K]
  ) {
    if (this.isDestroyed) return;
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    for (const listener of bucket) {
      (listener as Listener<K>)(payload);
    }
  }

  private emitCurrentTime() {
    if (!this.audio) return;
    const currentTime = this.audio.currentTime || 0;
    const duration = this.audio.duration || 0;
    let buffered = 0;
    if (this.audio.buffered && this.audio.buffered.length > 0) {
      buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
    }
    this.emit("time", {
      currentTime: isNaN(currentTime) ? 0 : currentTime,
      duration: isNaN(duration) ? 0 : duration,
      buffered: isNaN(buffered) ? 0 : buffered,
    });
  }

  private startTimeLoop() {
    if (this.rafId !== null) return;
    const loop = () => {
      if (!this.audio.paused && !this.audio.ended && !this.isSeeking) {
        this.emitCurrentTime();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopTimeLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private applyVolume() {
    const effective = this.muted ? 0 : this.volume;
    if (this.gainNode && this.audioContext) {
      try {
        this.gainNode.gain.setValueAtTime(effective, this.audioContext.currentTime);
      } catch {
        // fallback
      }
    }
    if (this.audio) {
      try {
        this.audio.volume = effective;
        this.audio.muted = this.muted;
      } catch {
        // ignore
      }
    }
  }

  async playUrl(url: string, options: PlayOptions = {}): Promise<void> {
    if (!url) {
      this.emit("error", { message: "No audio source provided", url: "" });
      throw new Error("No audio source provided");
    }

    const requestId = ++this.playRequestId;
    this.stopTimeLoop();
    this.emit("loading", { loading: true });

    // Initialize Web Audio graph if supported (non-Safari)
    this.ensureAudioGraph();
    if (this.audioContext && this.audioContext.state === "suspended") {
      void this.audioContext.resume().catch(() => {});
    }

    // Prepare audio element
    try {
      this.audio.pause();
    } catch {
      // ignore
    }

    this.currentUrl = url;
    this.audio.src = url;
    this.applyVolume();

    // Crossfade handling if specified and Web Audio gain node exists
    if (options.crossfadeMs && options.crossfadeMs > 0 && this.gainNode && this.audioContext) {
      const now = this.audioContext.currentTime;
      const targetVol = this.muted ? 0 : this.volume;
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(targetVol, now + options.crossfadeMs / 1000);
    }

    if (options.autoplay !== false) {
      try {
        // Crucial for Safari: Trigger play() synchronously without preceding await
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        if (this.playRequestId !== requestId) {
          this.audio.pause();
          return;
        }
      } catch (err: unknown) {
        if (this.playRequestId !== requestId) return;
        const e = err as { name?: string; message?: string };
        if (e.name === "AbortError") {
          return;
        }
        this.emit("loading", { loading: false });
        this.emit("error", { message: e.message || "Failed to start audio playback", url });
        throw err;
      }
    }
  }

  async play(): Promise<void> {
    const requestId = ++this.playRequestId;
    this.ensureAudioGraph();
    if (this.audioContext && this.audioContext.state === "suspended") {
      void this.audioContext.resume().catch(() => {});
    }

    try {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      if (this.playRequestId !== requestId) {
        this.audio.pause();
      }
    } catch (err: unknown) {
      if (this.playRequestId !== requestId) return;
      const e = err as { name?: string; message?: string };
      if (e.name === "AbortError") return;
      this.emit("error", { message: e.message || "Playback error", url: this.currentUrl || "" });
      throw err;
    }
  }

  pause() {
    this.playRequestId++;
    try {
      this.audio.pause();
    } catch {
      // ignore
    }
    this.stopTimeLoop();
  }

  stop() {
    this.playRequestId++;
    this.stopTimeLoop();
    try {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.removeAttribute("src");
      this.audio.load();
    } catch {
      // ignore
    }
    this.currentUrl = null;
    this.emit("time", { currentTime: 0, duration: 0, buffered: 0 });
    this.emit("pause", undefined);
  }

  seek(seconds: number) {
    if (!this.audio || !this.currentUrl) return;
    const duration = this.audio.duration || 0;
    const target = Math.max(0, Math.min(seconds, duration > 0 ? duration : seconds));

    this.isSeeking = true;
    try {
      this.audio.currentTime = target;
    } catch {
      // ignore
    }
    this.isSeeking = false;
    this.emitCurrentTime();
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyVolume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyVolume();
  }

  setCrossfade(ms: number) {
    this.crossfadeMs = Math.max(0, ms);
  }

  getCrossfade(): number {
    return this.crossfadeMs;
  }

  getSourceNode(): MediaElementAudioSourceNode | null {
    return this._sourceNode;
  }

  setEq(eq: EqSettings) {
    this.eqSettings = eq;
    if (this.bassFilter && this.midFilter && this.trebleFilter && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.bassFilter.gain.setTargetAtTime(eq.bass, now, 0.05);
        this.midFilter.gain.setTargetAtTime(eq.mid, now, 0.05);
        this.trebleFilter.gain.setTargetAtTime(eq.treble, now, 0.05);
      } catch {
        this.bassFilter.gain.value = eq.bass;
        this.midFilter.gain.value = eq.mid;
        this.trebleFilter.gain.value = eq.treble;
      }
    }
  }

  getAnalyser(): AnalyserNode | null {
    this.ensureAudioGraph();
    return this.analyserNode;
  }

  getGraphMode(): "webaudio" | "element" {
    return this.analyserNode ? "webaudio" : "element";
  }

  hasSource(): boolean {
    return Boolean(this.currentUrl && this.audio.src);
  }

  getCurrentTime(): number {
    return this.audio.currentTime || 0;
  }

  getDuration(): number {
    return this.audio.duration || 0;
  }

  getVolume(): number {
    return this.volume;
  }

  getMuted(): boolean {
    return this.muted;
  }

  destroy() {
    this.isDestroyed = true;
    this.stopTimeLoop();
    try {
      this.audio.pause();
      this.audio.src = "";
      this.audio.load();
    } catch {
      // ignore
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close().catch(() => {});
    }
    this.listeners.clear();
  }
}

export const audioEngine = new AudioEngine();
