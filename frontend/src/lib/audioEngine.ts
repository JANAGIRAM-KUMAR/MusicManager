import { Howl } from "howler";
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

class AudioEngine {
  private howl: Howl | null = null;
  private currentUrl: string | null = null;
  private listeners = new Map<keyof AudioEngineEventMap, Set<Listener<never>>>();
  private rafId: number | null = null;
  private volume = 0.7;
  private muted = false;

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
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    for (const listener of bucket) {
      (listener as Listener<K>)(payload);
    }
  }

  private startTimeLoop() {
    if (this.rafId !== null) return;
    const loop = () => {
      if (this.howl) {
        const seek = this.howl.seek();
        const currentTime = typeof seek === "number" ? seek : 0;
        const duration = this.howl.duration() || 0;
        this.emit("time", { currentTime, duration, buffered: duration });
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
    if (!this.howl) return;
    const effective = this.muted ? 0 : this.volume;
    this.howl.volume(effective);
  }

  async playUrl(url: string, options: PlayOptions = {}): Promise<void> {
    if (!url) throw new Error("No audio source provided");
    this.stopTimeLoop();
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }

    this.emit("loading", { loading: true });
    this.currentUrl = url;

    const howl: any = new Howl({
      src: [url],
      html5: true,
      preload: true,
      volume: this.muted ? 0 : this.volume,
      onload: () => {
        this.emit("loading", { loading: false });
        this.emit("duration", { duration: howl.duration() || 0 });
        this.startTimeLoop();
        if (options.autoplay !== false) {
          this.play().catch((e) => {
            this.emit("error", { message: "Playback failed", url });
            throw e;
          });
        }
      },
      onplay: () => {
        this.emit("loading", { loading: false });
        this.emit("play", undefined);
        this.startTimeLoop();
      },
      onpause: () => {
        this.emit("pause", undefined);
      },
      onend: () => {
        this.emit("ended", undefined);
        this.stopTimeLoop();
      },
      onloaderror: (_id: number | undefined, error: unknown) => {
        this.emit("loading", { loading: false });
        this.emit("error", { message: String(error), url });
      },
      onplayerror: (_id: number | undefined, error: unknown) => {
        this.emit("loading", { loading: false });
        this.emit("error", { message: String(error), url });
      },
    });
    this.howl = howl;

        if (this.howl) {
          (this.howl as any).once("load", () => {
            this.emit("graph", { mode: "webaudio" });
          });
        }
  }

  preload(url: string) {
    if (!url || url === this.currentUrl) return;
    try {
      new Howl({ src: [url], html5: true, preload: "metadata" });
    } catch {}
  }

  async play(): Promise<void> {
    const howl: any = this.howl;
    if (!howl) return;
    return new Promise((resolve, reject) => {
      try {
        const id = howl.play();
        if (id === undefined || id === null) {
          resolve();
          return;
        }
        howl.once("play", () => resolve(), id);
        setTimeout(() => resolve(), 100);
      } catch (e) {
        reject(e);
      }
    });
  }

  pause() {
    if (!this.howl) return;
    this.howl.pause();
  }

  seek(seconds: number) {
    if (!this.howl) return;
    this.howl.seek(seconds);
    const currentTime = typeof seconds === "number" ? seconds : 0;
    const duration = this.howl.duration() || 0;
    this.emit("time", { currentTime, duration, buffered: duration });
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyVolume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyVolume();
  }

  setCrossfade(_ms: number) {}

  setEq(_eq: EqSettings) {}

  getAnalyser(): AnalyserNode | null {
    return null;
  }

  getGraphMode(): "webaudio" | "element" {
    return "webaudio";
  }

  hasSource(): boolean {
    return Boolean(this.howl);
  }

  getCurrentTime(): number {
    if (!this.howl) return 0;
    const s = this.howl.seek();
    return typeof s === "number" ? s : 0;
  }

  getDuration(): number {
    if (!this.howl) return 0;
    return this.howl.duration() || 0;
  }

  getVolume(): number {
    return this.volume;
  }

  getMuted(): boolean {
    return this.muted;
  }

  destroy() {
    this.stopTimeLoop();
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }
    this.listeners.clear();
  }
}

interface PlayOptions {
  autoplay?: boolean;
  crossfadeMs?: number;
}

export const audioEngine = new AudioEngine();
