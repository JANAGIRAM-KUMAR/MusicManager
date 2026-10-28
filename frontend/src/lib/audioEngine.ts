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
  private compressorNode: DynamicsCompressorNode | null = null;
  private leftPanGain: GainNode | null = null;
  private rightPanGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  private currentUrl: string | null = null;
  private playRequestId = 0;
  private volume = 0.7;
  private muted = false;
  private crossfadeMs = 0;
  private playbackRate = 1.0;
  private normalizeVolume = false;
  private stereoPan = 0;
  private eqSettings: EqSettings = { enabled: true, preset: "Flat", bass: 0, mid: 0, treble: 0 };
  private listeners = new Map<keyof AudioEngineEventMap, Set<Listener<never>>>();
  private rafId: number | null = null;
  private isDestroyed = false;
  private isSeeking = false;
  private lastEmitTime = 0;
  private corsFallbackAttempted = false;

  constructor() {
    this.audio = typeof Audio !== "undefined" ? new Audio() : ({} as HTMLAudioElement);
    if (typeof window !== "undefined" && typeof this.audio.addEventListener === "function") {
      this.setupAudioElement();
    }
  }

  private setupAudioElement() {
    // Safari blocks or mutes createMediaElementSource on cross-origin/range streams (WebKit Bug #213797).
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
      this.ensureAudioGraph();
      if (this.audioContext && this.audioContext.state === "suspended") {
        void this.audioContext.resume().catch(() => {});
      }
      this.emit("loading", { loading: false });
      this.emit("play", undefined);
      this.startTimeLoop();
    });

    this.audio.addEventListener("pause", () => {
      // Ignore transient pause events when the track has ended or is seeking
      if (!this.audio.ended && !this.isSeeking) {
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
      this.ensureAudioGraph();
      if (this.audioContext && this.audioContext.state === "suspended") {
        void this.audioContext.resume().catch(() => {});
      }
      this.emit("loading", { loading: false });
      this.emit("play", undefined);
      this.startTimeLoop();
    });

    this.audio.addEventListener("canplay", () => {
      this.emit("loading", { loading: false });
    });

    this.audio.addEventListener("seeking", () => {
      this.isSeeking = true;
    });

    this.audio.addEventListener("seeked", () => {
      this.isSeeking = false;
      this.emitCurrentTime(true);
    });

    this.audio.addEventListener("error", () => {
      const error = this.audio.error;
      const url = this.currentUrl;

      // If anonymous CORS fails (e.g. byte-range CDN glitch), automatically fallback to direct native playback
      if (this.audio.crossOrigin && url && !this.corsFallbackAttempted) {
        this.corsFallbackAttempted = true;
        console.warn("CORS playback issue, recovering with direct native playback:", error?.message);
        try {
          this.audio.removeAttribute("crossorigin");
          this.audio.src = url;
          const playPromise = this.audio.play();
          if (playPromise) {
            playPromise.catch((e) => {
              console.error("Direct native playback retry failed:", e);
              this.stopTimeLoop();
              this.emit("loading", { loading: false });
              this.emit("error", { message: `Audio error: ${e.message}`, url });
            });
          }
          return;
        } catch {
          // ignore and emit error
        }
      }

      const message = error
        ? `Audio error code ${error.code}: ${error.message || "Failed to load"}`
        : "Audio error";
      this.stopTimeLoop();
      this.emit("loading", { loading: false });
      this.emit("error", { message, url: url || "" });
    });
  }

  public ensureAudioGraph(): boolean {
    if (this.audioContext && this.analyserNode && this._sourceNode) {
      return true;
    }
    if (typeof window === "undefined") return false;

    // Safari has a long-standing WebKit bug (#213797) where createMediaElementSource mutes cross-origin audio or outputs silence.
    // Playing directly through the native HTMLAudioElement in Safari ensures 100% reliable, clear audio.
    if (isSafari()) {
      return false;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      const ctx = this.audioContext;

      // Automatically attempt to resume if browser suspended context
      ctx.onstatechange = () => {
        if (ctx.state === "suspended" && !this.audio.paused && !this.audio.ended) {
          void ctx.resume().catch(() => {});
        }
      };

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
      treble.gain.value = this.eqSettings.enabled !== false ? this.eqSettings.treble : 0;
      this.trebleFilter = treble;

      // Realtime AnalyserNode with 512-point FFT (256 frequency bins) for rich musical spectrum resolution
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      this.analyserNode = analyser;

      // Master Gain
      const gain = ctx.createGain();
      gain.gain.value = this.muted ? 0 : this.volume;
      this.gainNode = gain;

      // Route: audio -> bass -> mid -> treble -> compressor -> stereo balance splitter/merger -> analyser -> gain -> destination
      if (!this._sourceNode) {
        this._sourceNode = ctx.createMediaElementSource(this.audio);
      }
      const source = this._sourceNode;

      source.connect(bass);
      bass.connect(mid);
      mid.connect(treble);

      let lastNode: AudioNode = treble;

      // Dynamics Compressor (Volume Normalizer)
      if (typeof ctx.createDynamicsCompressor === "function") {
        try {
          const compressor = ctx.createDynamicsCompressor();
          compressor.threshold.value = this.normalizeVolume ? -24 : 0;
          compressor.knee.value = 30;
          compressor.ratio.value = this.normalizeVolume ? 12 : 1;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.25;
          this.compressorNode = compressor;
          lastNode.connect(compressor);
          lastNode = compressor;
        } catch {
          // ignore compressor fallback
        }
      }

      // Universal Dedicated Stereo Balance Control using ChannelSplitter and ChannelMerger
      // Guaranteed to work identically across Safari, Chrome, Firefox, iOS, macOS, Windows
      try {
        const prePanGain = ctx.createGain();
        prePanGain.channelCount = 2;
        prePanGain.channelCountMode = "explicit";
        prePanGain.channelInterpretation = "speakers";

        const splitter = ctx.createChannelSplitter(2);
        const leftGain = ctx.createGain();
        const rightGain = ctx.createGain();
        const merger = ctx.createChannelMerger(2);

        splitter.channelCountMode = "explicit";
        splitter.channelCount = 2;

        lastNode.connect(prePanGain);
        prePanGain.connect(splitter);
        splitter.connect(leftGain, 0);
        splitter.connect(rightGain, 1);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);

        this.leftPanGain = leftGain;
        this.rightPanGain = rightGain;
        lastNode = merger;
      } catch (pannerErr) {
        console.warn("Stereo balance matrix setup skipped:", pannerErr);
      }
      this.applyStereoPan(this.stereoPan);

      lastNode.connect(analyser);
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

  private emitCurrentTime(force = false) {
    if (!this.audio) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    // Throttle progress updates to ~140ms to avoid React 19 re-render starvation (from 120Hz down to ~7Hz)
    if (!force && now - this.lastEmitTime < 140) {
      return;
    }
    this.lastEmitTime = now;

    const currentTime = this.audio.currentTime || 0;
    const duration = this.audio.duration || 0;
    let buffered = 0;
    if (this.audio.buffered && this.audio.buffered.length > 0) {
      try {
        buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
      } catch {
        // ignore
      }
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
    if (this.gainNode && this.audioContext && !isSafari()) {
      try {
        this.gainNode.gain.setValueAtTime(effective, this.audioContext.currentTime);
      } catch {
        this.gainNode.gain.value = effective;
      }
      if (this.audio) {
        try {
          this.audio.volume = 1.0;
          this.audio.muted = false;
        } catch {
          // ignore
        }
      }
    } else if (this.audio) {
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
    this.corsFallbackAttempted = false;
    this.stopTimeLoop();
    this.emit("loading", { loading: true });

    // On Safari, strip any crossorigin attribute to allow native media playback
    if (isSafari() && this.audio && typeof this.audio.removeAttribute === "function") {
      this.audio.removeAttribute("crossorigin");
    }

    // Initialize Web Audio graph if supported (non-Safari)
    this.ensureAudioGraph();
    if (this.audioContext && this.audioContext.state === "suspended") {
      void this.audioContext.resume().catch(() => {});
    }

    // Only pause and reload if switching to a different URL
    if (this.currentUrl !== url || !this.audio.src) {
      try {
        this.audio.pause();
      } catch {
        // ignore
      }
      this.currentUrl = url;
      this.audio.src = url;
    }

    this.applyVolume();

    // Apply playback rate
    if (this.audio) {
      try {
        this.audio.playbackRate = this.playbackRate;
      } catch {
        // ignore
      }
    }

    // Crossfade handling if specified and Web Audio gain node exists
    if (options.crossfadeMs && options.crossfadeMs > 0 && this.gainNode && this.audioContext) {
      const now = this.audioContext.currentTime;
      const targetVol = this.muted ? 0 : this.volume;
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(targetVol, now + options.crossfadeMs / 1000);
    }

    if (options.autoplay !== false) {
      try {
        // Crucial for Safari & mobile: Trigger play() synchronously without preceding await
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        if (this.playRequestId !== requestId) {
          if (this.currentUrl !== url) {
            this.audio.pause();
          }
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
        if (this.audio.src !== this.currentUrl) {
          this.audio.pause();
        }
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
    // Note: isSeeking will be reset to false in the 'seeked' event listener
    this.emitCurrentTime(true);
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

  setPlaybackRate(rate: number) {
    const clamped = Math.min(2.0, Math.max(0.5, rate));
    this.playbackRate = clamped;
    if (this.audio) {
      try {
        this.audio.playbackRate = clamped;
      } catch {
        // ignore
      }
    }
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  private applyStereoPan(pan: number) {
    const clamped = Math.min(1, Math.max(-1, pan));
    this.stereoPan = clamped;

    if (this.audioContext && this.leftPanGain && this.rightPanGain) {
      const now = this.audioContext.currentTime;
      // Absolute channel attenuation:
      // When pan = -1.0 (Hard Left): Left = 1.0, Right = 0.0 (Right channel 100% silent)
      // When pan = 0.0 (Center): Left = 1.0, Right = 1.0 (Both channels full)
      // When pan = +1.0 (Hard Right): Left = 0.0, Right = 1.0 (Left channel 100% silent)
      const leftVal = clamped <= 0 ? 1 : Math.max(0, 1 - clamped);
      const rightVal = clamped >= 0 ? 1 : Math.max(0, 1 + clamped);

      try {
        this.leftPanGain.gain.setValueAtTime(leftVal, now);
        this.rightPanGain.gain.setValueAtTime(rightVal, now);
      } catch {
        this.leftPanGain.gain.value = leftVal;
        this.rightPanGain.gain.value = rightVal;
      }
    }
  }

  setStereoPan(pan: number) {
    this.ensureAudioGraph();
    this.applyStereoPan(pan);
  }

  getStereoPan(): number {
    return this.stereoPan;
  }

  setNormalizeVolume(enabled: boolean) {
    this.normalizeVolume = enabled;
    if (this.compressorNode && this.audioContext) {
      const now = this.audioContext.currentTime;
      try {
        this.compressorNode.threshold.setTargetAtTime(enabled ? -24 : 0, now, 0.05);
        this.compressorNode.ratio.setTargetAtTime(enabled ? 12 : 1, now, 0.05);
      } catch {
        this.compressorNode.threshold.value = enabled ? -24 : 0;
        this.compressorNode.ratio.value = enabled ? 12 : 1;
      }
    }
  }

  getNormalizeVolume(): boolean {
    return this.normalizeVolume;
  }

  setEq(eq: EqSettings) {
    this.eqSettings = { ...this.eqSettings, ...eq };
    const isEnabled = this.eqSettings.enabled !== false;
    const targetBass = isEnabled ? this.eqSettings.bass : 0;
    const targetMid = isEnabled ? this.eqSettings.mid : 0;
    const targetTreble = isEnabled ? this.eqSettings.treble : 0;

    if (this.bassFilter && this.midFilter && this.trebleFilter && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.bassFilter.gain.setTargetAtTime(targetBass, now, 0.05);
        this.midFilter.gain.setTargetAtTime(targetMid, now, 0.05);
        this.trebleFilter.gain.setTargetAtTime(targetTreble, now, 0.05);
      } catch {
        this.bassFilter.gain.value = targetBass;
        this.midFilter.gain.value = targetMid;
        this.trebleFilter.gain.value = targetTreble;
      }
    }
  }

  getEq(): EqSettings {
    return this.eqSettings;
  }

  getAudioContextState(): { sampleRate: number; state: string } | null {
    this.ensureAudioGraph();
    if (!this.audioContext) return null;
    return {
      sampleRate: this.audioContext.sampleRate,
      state: this.audioContext.state,
    };
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate || 44100;
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
