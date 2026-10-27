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

interface Deck {
  el: HTMLAudioElement;
  gain: GainNode | null;
  url: string | null;
  requestedUrl: string | null;
  retried: boolean;
  shouldPlay: boolean;
}

interface PlayOptions {
  autoplay?: boolean;
  crossfadeMs?: number;
}

const DEFAULT_EQ: EqSettings = { bass: 0, mid: 0, treble: 0 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const wavFallback = (url: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin !== window.location.origin) return null;
    if (!/\.mp3$/i.test(parsed.pathname)) return null;
    return parsed.pathname.replace(/\.mp3$/i, ".wav") + parsed.search;
  } catch {
    return null;
  }
};

class AudioEngine {
  private decks: Deck[] = [];
  private activeIndex = 0;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private bass: BiquadFilterNode | null = null;
  private mid: BiquadFilterNode | null = null;
  private treble: BiquadFilterNode | null = null;
  private graphFailed = false;
  private volume = 0.7;
  private muted = false;
  private crossfadeMs = 0;
  private eq: EqSettings = { ...DEFAULT_EQ };
  private listeners = new Map<keyof AudioEngineEventMap, Set<Listener<never>>>();
  private fadeTimer: number | null = null;
  private playToken = 0;

  constructor() {
    this.decks = [0, 1].map((index) => this.createDeck(index));
  }

  private createDeck(index: number): Deck {
    const el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.setAttribute("playsinline", "true");

    const deck: Deck = {
      el,
      gain: null,
      url: null,
      requestedUrl: null,
      retried: false,
      shouldPlay: false,
    };

    const isActive = () => this.decks[this.activeIndex] === deck;

    el.addEventListener("timeupdate", () => {
      if (!isActive()) return;
      this.emit("time", this.readTime(el));
    });

    el.addEventListener("progress", () => {
      if (!isActive()) return;
      this.emit("time", this.readTime(el));
    });

    el.addEventListener("loadedmetadata", () => {
      if (!isActive()) return;
      this.emit("duration", { duration: Number.isFinite(el.duration) ? el.duration : 0 });
    });

    el.addEventListener("durationchange", () => {
      if (!isActive()) return;
      this.emit("duration", { duration: Number.isFinite(el.duration) ? el.duration : 0 });
    });

    el.addEventListener("playing", () => {
      if (!isActive()) return;
      this.emit("loading", { loading: false });
      this.emit("play", undefined);
    });

    el.addEventListener("play", () => {
      if (!isActive()) return;
      this.emit("play", undefined);
    });

    el.addEventListener("pause", () => {
      if (!isActive()) return;
      this.emit("pause", undefined);
    });

    el.addEventListener("waiting", () => {
      if (!isActive()) return;
      this.emit("loading", { loading: true });
    });

    el.addEventListener("canplay", () => {
      if (!isActive()) return;
      this.emit("loading", { loading: false });
    });

    el.addEventListener("ended", () => {
      if (!isActive()) return;
      deck.shouldPlay = false;
      // Ensure only active deck triggers ended
      this.emit("ended", undefined);
    });

    el.addEventListener("error", () => {
      this.handleDeckError(index);
    });

    return deck;
  }

  on<K extends keyof AudioEngineEventMap>(
    event: K,
    listener: Listener<K>
  ): () => void {
    const bucket =
      this.listeners.get(event) ?? new Set<Listener<never>>();
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

  private readTime(el: HTMLAudioElement): AudioEngineTime {
    let buffered = 0;
    if (el.buffered.length > 0) {
      buffered = el.buffered.end(el.buffered.length - 1);
    }
    return {
      currentTime: Number.isFinite(el.currentTime) ? el.currentTime : 0,
      duration: Number.isFinite(el.duration) ? el.duration : 0,
      buffered,
    };
  }

  private handleDeckError(index: number) {
    const deck = this.decks[index];
    if (!deck.url) return;

    const isActive = this.decks[this.activeIndex] === deck;

    if (!deck.retried) {
      const fallback = wavFallback(deck.url);
      if (fallback && fallback !== deck.url) {
        deck.retried = true;
        deck.url = fallback;
        if (isActive) this.emit("loading", { loading: true });
        deck.el.src = fallback;
        deck.el.load();

        if (isActive && deck.shouldPlay) {
          void deck.el.play().catch(() => {
            if (isActive) deck.shouldPlay = false;
          });
        }
        return;
      }
      // Try mp3 alternative
      try {
        if (deck.url.endsWith(".wav")) {
          deck.retried = true;
          const mp3 = deck.url.replace(/\.wav$/i, ".mp3");
          deck.url = mp3;
          if (isActive) this.emit("loading", { loading: true });
          deck.el.src = mp3;
          deck.el.load();
          if (isActive && deck.shouldPlay) {
            void deck.el.play().catch(() => {});
          }
          return;
        } else if (deck.url.endsWith(".mp3")) {
          deck.retried = true;
          const wav = deck.url.replace(/\.mp3$/i, ".wav");
          deck.url = wav;
          if (isActive) this.emit("loading", { loading: true });
          deck.el.src = wav;
          deck.el.load();
          if (isActive && deck.shouldPlay) {
            void deck.el.play().catch(() => {});
          }
          return;
        }
      } catch {}
    }

    if (!isActive) return;

    const message = deck.el.error?.message || "Unable to load audio stream";
    this.emit("error", { message, url: deck.url });
  }

  private ensureGraph() {
    if (this.graphFailed) {
      this.emit("graph", { mode: "element" });
      return;
    }

    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }

    try {
      const Ctor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!Ctor) throw new Error("Web Audio API unavailable");

      const ctx = new Ctor();
      const master = ctx.createGain();
      const analyser = ctx.createAnalyser();
      const bass = ctx.createBiquadFilter();
      const mid = ctx.createBiquadFilter();
      const treble = ctx.createBiquadFilter();

      bass.type = "lowshelf";
      bass.frequency.value = 200;
      mid.type = "peaking";
      mid.frequency.value = 1200;
      mid.Q.value = 0.9;
      treble.type = "highshelf";
      treble.frequency.value = 5200;

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      bass.connect(mid);
      mid.connect(treble);
      treble.connect(master);
      master.connect(analyser);
      analyser.connect(ctx.destination);

      for (const deck of this.decks) {
        const source = ctx.createMediaElementSource(deck.el);
        const gain = ctx.createGain();
        source.connect(gain);
        gain.connect(bass);
        deck.gain = gain;
      }

      this.ctx = ctx;
      this.master = master;
      this.analyser = analyser;
      this.bass = bass;
      this.mid = mid;
      this.treble = treble;

      this.applyVolume();
      this.applyEq();
      this.resetDeckGains();

      this.emit("graph", { mode: "webaudio" });
    } catch {
      this.graphFailed = true;
      this.ctx = null;
      this.master = null;
      this.analyser = null;
      this.bass = null;
      this.mid = null;
      this.treble = null;
      for (const deck of this.decks) {
        deck.gain = null;
      }
      this.applyVolume();
      this.emit("graph", { mode: "element" });
    }
  }

  private resetDeckGains() {
    this.decks.forEach((deck, index) => {
      if (!deck.gain) return;
      deck.gain.gain.cancelScheduledValues(0);
      deck.gain.gain.value = index === this.activeIndex ? 1 : 0;
    });
  }

  private applyVolume() {
    const effective = this.muted ? 0 : this.volume;
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(effective * effective, now + 0.05);
      for (const deck of this.decks) deck.el.volume = 1;
      return;
    }
    for (const deck of this.decks) deck.el.volume = effective;
  }

  private applyEq() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const apply = (
      filter: BiquadFilterNode | null,
      value: number
    ) => {
      if (!filter) return;
      filter.gain.cancelScheduledValues(now);
      filter.gain.setValueAtTime(filter.gain.value, now);
      filter.gain.linearRampToValueAtTime(clamp(value, -15, 15), now + 0.05);
    };
    apply(this.bass, this.eq.bass);
    apply(this.mid, this.eq.mid);
    apply(this.treble, this.eq.treble);
  }

  private fadeTo(deck: Deck, target: number, ms: number) {
    if (!this.ctx || !deck.gain) return;
    const now = this.ctx.currentTime;
    const gain = deck.gain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    if (ms <= 0) {
      gain.setValueAtTime(target, now);
    } else {
      gain.linearRampToValueAtTime(target, now + ms / 1000);
    }
  }

  private waitForCanPlay(el: HTMLAudioElement, timeoutMs: number) {
    if (el.readyState >= 2 && Number.isFinite(el.duration) && el.duration > 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        el.removeEventListener("canplay", finish);
        el.removeEventListener("loadedmetadata", finish);
        el.removeEventListener("error", finish);
        window.clearTimeout(timer);
        resolve();
      };
      const timer = window.setTimeout(finish, timeoutMs);
      el.addEventListener("canplay", finish, { once: true });
      el.addEventListener("loadedmetadata", finish, { once: true });
      el.addEventListener("error", finish, { once: true });
    });
  }

  async playUrl(url: string, options: PlayOptions = {}): Promise<void> {
    if (!url) throw new Error("No audio source provided");

    const requestToken = ++this.playToken;
    const autoplay = options.autoplay ?? true;
    const fadeMs = clamp(options.crossfadeMs ?? this.crossfadeMs, 0, 8000);

    this.ensureGraph();

    const active = this.decks[this.activeIndex];
    if (active.requestedUrl === url || active.url === url) {
      // Stop the other deck to avoid dual playback
      const other = this.decks[1 - this.activeIndex];
      if (other !== active) {
        try {
          other.shouldPlay = false;
          other.el.pause();
          other.el.currentTime = 0;
        } catch {
          // ignore
        }
      }
      if (autoplay) {
        try {
          await this.play();
        } catch {
          // ignore
        }
      }
      return;
    }

    // Always stop both decks first when switching
    for (const deck of this.decks) {
      try {
        deck.shouldPlay = false;
        deck.el.pause();
      } catch {
        // ignore
      }
    }

    const nextIndex = active.url ? 1 - this.activeIndex : this.activeIndex;
    const next = this.decks[nextIndex];
    const isSameDeck = next === active;

    if (next.requestedUrl !== url) {
      next.retried = false;
      next.requestedUrl = url;
      next.url = url;
      next.el.src = url;
      next.el.load();
    }

    if (next.gain) {
      next.gain.gain.cancelScheduledValues(0);
      next.gain.gain.value = fadeMs > 0 ? 0 : 1;
    } else {
      // Ensure inactive deck is muted when using element mode
      if (next.el !== active.el) {
        next.el.volume = 0;
      }
    }

    this.emit("loading", { loading: true });

    await this.waitForCanPlay(next.el, 10000);
    if (requestToken !== this.playToken || next.requestedUrl !== url) return;

    const wasPlaying = !active.el.paused;

    this.activeIndex = nextIndex;
    next.el.currentTime = 0;
    next.shouldPlay = autoplay;

    if (autoplay) {
      try {
        await next.el.play();
      } catch (initialError) {
        let error = initialError;

        if (!next.retried) {
          const fallback = wavFallback(next.url ?? url);
          if (fallback) {
            next.retried = true;
            next.url = fallback;
            next.el.src = fallback;
            next.el.load();
            this.emit("loading", { loading: true });
            await this.waitForCanPlay(next.el, 10000);
            if (requestToken !== this.playToken) return;
            next.shouldPlay = true;
            try {
              await next.el.play();
              error = null;
            } catch (retryError) {
              error = retryError;
            }
          }
        } else if (next.url && next.url !== url) {
          await this.waitForCanPlay(next.el, 10000);
          if (requestToken !== this.playToken) return;
          next.shouldPlay = true;
          try {
            await next.el.play();
            error = null;
          } catch (retryError) {
            error = retryError;
          }
        }

        if (error) {
          next.shouldPlay = false;
          this.emit("loading", { loading: false });
          throw error;
        }
      }
    }

    if (isSameDeck) {
      this.fadeTo(next, 1, 0);
      if (this.ctx) {
        next.el.volume = 1;
      } else {
        next.el.volume = this.muted ? 0 : this.volume;
      }
      const other = this.decks[1 - this.activeIndex];
      try {
        other.shouldPlay = false;
        other.el.pause();
        other.el.currentTime = 0;
      } catch {
        // ignore
      }
    } else {
      // Always pause old deck completely
      active.shouldPlay = false;
      try {
        active.el.pause();
        active.el.currentTime = 0;
      } catch {
        // ignore
      }
      if (fadeMs > 0 && wasPlaying && this.ctx && next.gain) {
        this.fadeTo(active, 0, fadeMs);
        this.fadeTo(next, 1, fadeMs);
        if (this.fadeTimer) window.clearTimeout(this.fadeTimer);
        this.fadeTimer = window.setTimeout(() => {
          if (this.decks[this.activeIndex] === next) {
            active.shouldPlay = false;
            try {
              active.el.pause();
              active.el.currentTime = 0;
            } catch {
              // ignore
            }
          }
        }, fadeMs + 200);
      } else {
        this.fadeTo(active, 0, 0);
        this.fadeTo(next, 1, 0);
        if (!this.ctx) {
          active.el.volume = 0;
          next.el.volume = this.muted ? 0 : this.volume;
        }
      }
    }

    this.emit("duration", {
      duration: Number.isFinite(next.el.duration) ? next.el.duration : 0,
    });
    this.emit("loading", { loading: false });
  }

  preload(url: string) {
    if (!url) return;
    const current = this.decks[this.activeIndex];
    if (current.requestedUrl === url || current.url === url) return;

    const inactive = this.decks[1 - this.activeIndex];
    if (!inactive.el.paused && inactive.url) return;
    if (inactive.requestedUrl === url) return;

    inactive.retried = false;
    inactive.requestedUrl = url;
    inactive.url = url;
    inactive.el.src = url;
    inactive.el.preload = "auto";
    inactive.el.load();
  }

  async play(): Promise<void> {
    this.ensureGraph();
    const active = this.decks[this.activeIndex];
    if (!active.url) return;
    active.shouldPlay = true;
    if (this.ctx?.state === "suspended") await this.ctx.resume();
    await active.el.play();
  }

  pause() {
    const active = this.decks[this.activeIndex];
    active.shouldPlay = false;
    active.el.pause();
  }

  seek(seconds: number) {
    const active = this.decks[this.activeIndex];
    if (!Number.isFinite(seconds)) return;
    const duration = Number.isFinite(active.el.duration)
      ? active.el.duration
      : seconds;
    active.el.currentTime = clamp(seconds, 0, Math.max(0, duration));
    this.emit("time", this.readTime(active.el));
  }

  setVolume(volume: number) {
    this.volume = clamp(volume, 0, 1);
    this.applyVolume();
  }

  getVolume(): number {
    return this.volume;
  }

  getMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyVolume();
  }

  setCrossfade(ms: number) {
    this.crossfadeMs = clamp(ms, 0, 12000);
  }

  setEq(eq: EqSettings) {
    this.eq = { ...eq };
    this.applyEq();
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getGraphMode(): "webaudio" | "element" {
    return this.ctx ? "webaudio" : "element";
  }

  hasSource(): boolean {
    const active = this.decks[this.activeIndex];
    return Boolean(active.requestedUrl || active.url);
  }

  getCurrentTime(): number {
    return this.decks[this.activeIndex].el.currentTime || 0;
  }

  getDuration(): number {
    const duration = this.decks[this.activeIndex].el.duration;
    return Number.isFinite(duration) ? duration : 0;
  }

  destroy() {
    if (this.fadeTimer) window.clearTimeout(this.fadeTimer);
    for (const deck of this.decks) {
      deck.el.pause();
      deck.el.removeAttribute("src");
      deck.el.load();
    }
    if (this.ctx) void this.ctx.close();
    this.listeners.clear();
  }
}

export const audioEngine = new AudioEngine();
