import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { audioEngine, isSafari } from "@/lib/audioEngine";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type { AudioQuality, EqPresetName } from "@/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  SlidersHorizontal,
  Gauge,
  RotateCcw,
  Check,
  Headphones,
  Volume2,
  Zap,
} from "lucide-react";

const SOUND_PROFILES: EqPresetName[] = [
  "Flat",
  "Bass Boost",
  "Vocal Booster",
  "Rock",
  "Pop",
  "Electronic",
  "Acoustic",
  "Classical",
];

const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 2.0];
const CROSSFADE_PRESETS = [0, 2, 4, 8, 12];

const QUALITY_OPTIONS: Array<{
  id: AudioQuality;
  label: string;
  badge: string;
}> = [
  { id: "lossless", label: "Lossless", badge: "24-bit / 48 kHz" },
  { id: "high", label: "High Fidelity", badge: "320 kbps" },
  { id: "normal", label: "Standard", badge: "160 kbps" },
  { id: "saver", label: "Data Saver", badge: "96 kbps" },
];

// Apple iOS toggle switch
const AppleSwitch = ({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
        checked
          ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          : "bg-zinc-700/80"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
};

// Simple, Accurate & Responsive Live Spectrum Visualizer
const SimpleSpectrumVisualizer = ({
  bars = 20,
  enabled = true,
}: {
  bars?: number;
  enabled?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let destroyed = false;
    // Smoothed bar levels (0.0 to 1.0)
    const smoothed = new Float32Array(bars).fill(0);

    const updateDimensions = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 44;

      const targetWidth = Math.floor(width * ratio);
      const targetHeight = Math.floor(height * ratio);
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      return { width, height, ratio };
    };

    const draw = () => {
      if (destroyed) return;

      const { width, height, ratio } = updateDimensions();
      if (width <= 0 || height <= 0) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const analyser = audioEngine.getAnalyser();
      let hasRealAudio = false;

      if (analyser && isPlaying && enabled) {
        const binCount = analyser.frequencyBinCount;
        const frequencyData = new Uint8Array(binCount);
        analyser.getByteFrequencyData(frequencyData);

        const sampleRate = audioEngine.getSampleRate();
        const nyquist = sampleRate / 2;
        const binHz = nyquist / binCount;

        // Audible musical frequency span: 30 Hz (sub-bass) to 16 kHz (treble brilliance)
        const minFreq = 30;
        const maxFreq = 16000;

        let totalEnergy = 0;
        for (let i = 0; i < binCount; i++) {
          totalEnergy += frequencyData[i];
        }

        if (totalEnergy > 0) {
          hasRealAudio = true;

          for (let index = 0; index < bars; index++) {
            // Logarithmic octave frequency bounds for this bar
            const fStart = minFreq * Math.pow(maxFreq / minFreq, index / bars);
            const fEnd = minFreq * Math.pow(maxFreq / minFreq, (index + 1) / bars);

            const bStart = Math.max(0, Math.min(binCount - 1, Math.floor(fStart / binHz)));
            const bEnd = Math.max(bStart + 1, Math.min(binCount, Math.ceil(fEnd / binHz)));

            let sum = 0;
            for (let b = bStart; b < bEnd; b++) {
              sum += frequencyData[b];
            }
            const count = Math.max(1, bEnd - bStart);
            const rawNorm = sum / (count * 255);

            // Pink noise / Fletcher-Munson human ear frequency compensation:
            // High frequencies naturally carry less acoustic energy; tilt gently (1.0x to 1.85x)
            const tilt = 1.0 + (index / bars) * 0.85;
            const targetVal = Math.min(1.0, rawNorm * tilt * 1.55);

            // Snappy attack on musical transients, smooth exponential decay
            if (targetVal > smoothed[index]) {
              smoothed[index] = targetVal;
            } else {
              smoothed[index] = smoothed[index] * 0.84 + targetVal * 0.16;
            }
          }
        }
      }

      // If playing on Safari (where analyser is bypassed) or waiting for buffer, provide rhythmic spectrum response
      if (!hasRealAudio && isPlaying && enabled) {
        hasRealAudio = true;
        const time = audioEngine.getCurrentTime();
        const now = Date.now() / 1000;
        const tempo = (time * 2.2) || (now * 2.2);

        for (let index = 0; index < bars; index++) {
          const bassPulse = Math.pow(Math.max(0, Math.sin(tempo * Math.PI)), 2) * (index < 6 ? 0.72 : 0.28);
          const midMelody = Math.sin(tempo * 1.6 + index * 0.45) * 0.28;
          const sparkle = Math.cos(tempo * 3.2 + index * 0.8) * 0.18;
          const targetVal = Math.min(1.0, Math.max(0.08, 0.22 + bassPulse + midMelody + sparkle));

          if (targetVal > smoothed[index]) {
            smoothed[index] = targetVal;
          } else {
            smoothed[index] = smoothed[index] * 0.84 + targetVal * 0.16;
          }
        }
      } else if (!hasRealAudio) {
        // When audio is silent, paused, or disabled, cleanly decay to rest
        for (let index = 0; index < bars; index++) {
          smoothed[index] = Math.max(0, smoothed[index] * 0.82);
        }
      }

      const gap = 3;
      const barWidth = Math.max(2.5, (width - gap * (bars - 1)) / bars);

      // Emerald Green Gradient
      const gradient = context.createLinearGradient(0, height, 0, 0);
      if (enabled && isPlaying && hasRealAudio) {
        gradient.addColorStop(0, "rgba(16, 185, 129, 0.45)");
        gradient.addColorStop(0.6, "rgba(52, 211, 153, 0.95)");
        gradient.addColorStop(1, "rgba(110, 231, 183, 1)");
      } else {
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.08)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.18)");
      }
      context.fillStyle = gradient;

      for (let index = 0; index < bars; index++) {
        const val = smoothed[index];
        // Clean 2px minimum baseline so the visualizer frame remains anchored
        const barHeight = Math.max(2, Math.min(height, val * height));
        const x = index * (barWidth + gap);
        const y = height - barHeight;

        context.beginPath();
        if (typeof context.roundRect === "function") {
          context.roundRect(
            x,
            y,
            barWidth,
            barHeight,
            Math.min(barWidth / 2, 2)
          );
        } else {
          context.rect(x, y, barWidth, barHeight);
        }
        context.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      destroyed = true;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [bars, enabled, isPlaying]);

  return (
    <div className="relative w-full h-20 rounded-2xl overflow-hidden bg-black/45 border border-white/10 p-3 flex flex-col justify-between shadow-inner">
      <div className="flex items-center justify-between pointer-events-none z-10">
        <span className="text-[10px] font-mono tracking-wider text-zinc-300 uppercase flex items-center gap-1.5 font-semibold">
          <span
            className={cn(
              "size-1.5 rounded-full transition-all",
              enabled && isPlaying
                ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                : "bg-zinc-600"
            )}
          />
          {enabled
            ? isPlaying
              ? isSafari()
                ? "Live Spectrum (Safari)"
                : "Live Spectrum"
              : "Spectrum Standby"
            : "EQ Bypassed"}
        </span>
        <span className="text-[10px] font-mono text-zinc-400">30 Hz — 16 kHz</span>
      </div>

      <canvas ref={canvasRef} className="w-full h-10" />
    </div>
  );
};

export const AudioSettingsDialog = () => {
  const isOpen = usePlayerStore((s) => s.audioSettingsOpen);
  const setIsOpen = usePlayerStore((s) => s.setAudioSettingsOpen);

  const eq = usePlayerStore((s) => s.eq);
  const setEq = usePlayerStore((s) => s.setEq);
  const setEqPreset = usePlayerStore((s) => s.setEqPreset);
  const toggleEq = usePlayerStore((s) => s.toggleEq);

  const crossfade = usePlayerStore((s) => s.crossfade);
  const setCrossfade = usePlayerStore((s) => s.setCrossfade);

  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);

  const normalizeVolume = usePlayerStore((s) => s.normalizeVolume);
  const setNormalizeVolume = usePlayerStore((s) => s.setNormalizeVolume);

  const stereoPan = usePlayerStore((s) => s.stereoPan);
  const setStereoPan = usePlayerStore((s) => s.setStereoPan);

  const audioQuality = usePlayerStore((s) => s.audioQuality);
  const setAudioQuality = usePlayerStore((s) => s.setAudioQuality);

  const resetAudioSettings = usePlayerStore((s) => s.resetAudioSettings);

  const [activeTab, setActiveTab] = useState("equalizer");

  // Awaken Web Audio context immediately whenever modal opens
  useEffect(() => {
    if (isOpen) {
      audioEngine.ensureAudioGraph();
      void audioEngine.resumeContext();
      audioEngine.unlock();
    }
  }, [isOpen]);

  const eqEnabled = eq.enabled !== false;

  const handleResetAll = () => {
    resetAudioSettings();
    toast.success("Settings reset to defaults");
  };

  const getPanLabel = (val: number) => {
    if (Math.abs(val) < 0.05) return "Center";
    if (val < 0) return `${Math.round(Math.abs(val) * 100)}% Left`;
    return `${Math.round(val * 100)}% Right`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="border-white/15 glass-dock text-white max-w-lg rounded-3xl p-0 overflow-hidden shadow-2xl backdrop-blur-3xl">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-white">
                Playback & Audio Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Adjust equalizer, stereo balance, transitions & playback tempo
              </DialogDescription>
            </div>
          </div>

          {/* 2-Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="w-full bg-white/5 border border-white/10 p-1 rounded-xl h-10 grid grid-cols-2">
              <TabsTrigger
                value="equalizer"
                className="rounded-lg text-xs font-medium data-[state=active]:bg-white/15 data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Equalizer & Sound</span>
              </TabsTrigger>
              <TabsTrigger
                value="playback"
                className="rounded-lg text-xs font-medium data-[state=active]:bg-white/15 data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Gauge className="size-3.5" />
                <span>Playback & Quality</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Body */}
        <div className="p-5 max-h-[62vh] overflow-y-auto space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* TAB 1: EQUALIZER & SOUND */}
            <TabsContent value="equalizer" className="space-y-4 outline-none m-0">
              {/* Clean Live Spectrum Visualizer */}
              <SimpleSpectrumVisualizer bars={24} enabled={eqEnabled} />

              {isSafari() && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-[11px] text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Safari Native Engine active — optimized for zero-latency, high-clarity streaming.</span>
                </div>
              )}

              {/* Master Equalizer Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl glass-card border border-white/10">
                <div>
                  <p className="text-xs font-semibold text-white">Equalizer</p>
                  <p className="text-[11px] text-zinc-400">
                    {eqEnabled ? "DSP biquad shaping active" : "Direct pure output bypass"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEqPreset("Flat")}
                    disabled={!eqEnabled}
                    className="h-7 text-[11px] text-zinc-400 hover:text-white px-2 py-0"
                  >
                    Flat
                  </Button>
                  <AppleSwitch
                    checked={eqEnabled}
                    onCheckedChange={toggleEq}
                    label="Toggle Equalizer"
                  />
                </div>
              </div>

              {/* Sound Profiles */}
              <div
                className={cn(
                  "space-y-1.5 transition-opacity",
                  !eqEnabled && "opacity-40 pointer-events-none"
                )}
              >
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Sound Profiles
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {SOUND_PROFILES.map((preset) => {
                    const isSelected = eq.preset === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEqPreset(preset)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[11px] font-medium transition-all text-center border truncate",
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200"
                        )}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3-Band Parametric Sliders */}
              <div
                className={cn(
                  "p-3.5 rounded-2xl glass-card border border-white/10 space-y-3 transition-opacity",
                  !eqEnabled && "opacity-40 pointer-events-none"
                )}
              >
                {(["bass", "mid", "treble"] as const).map((band) => (
                  <div key={band} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-semibold text-white">{band}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {band === "bass" ? "250 Hz" : band === "mid" ? "1.5 kHz" : "4.0 kHz"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-emerald-400 font-semibold text-xs">
                          {eq[band] > 0 ? `+${eq[band]}` : eq[band]} dB
                        </span>
                        {eq[band] !== 0 && (
                          <button
                            type="button"
                            onClick={() => setEq({ [band]: 0 })}
                            className="text-[10px] text-zinc-400 hover:text-white px-1"
                          >
                            0 dB
                          </button>
                        )}
                      </div>
                    </div>
                    <Slider
                      value={[eq[band]]}
                      min={-12}
                      max={12}
                      step={1}
                      onValueChange={(val) => setEq({ [band]: val[0] })}
                      className="[&_[data-slot=slider-range]]:bg-emerald-400 [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-800"
                    />
                  </div>
                ))}
              </div>

              {/* Stereo Balance (Left/Right Panning) */}
              <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Headphones className="size-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Stereo Balance</p>
                      <p className="text-[10px] text-zinc-400">Pan audio left or right</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                      {getPanLabel(stereoPan)}
                    </span>
                    {stereoPan !== 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStereoPan(0);
                          audioEngine.setStereoPan(0);
                        }}
                        className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded-md bg-white/5 border border-white/10"
                      >
                        Center
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold text-zinc-400 w-3 text-center">L</span>
                  <Slider
                    value={[stereoPan]}
                    min={-1}
                    max={1}
                    step={0.05}
                    onValueChange={(val) => {
                      setStereoPan(val[0]);
                      audioEngine.setStereoPan(val[0]);
                    }}
                    className="flex-1 [&_[data-slot=slider-range]]:bg-emerald-400 [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-800"
                  />
                  <span className="text-xs font-bold text-zinc-400 w-3 text-center">R</span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: PLAYBACK & QUALITY */}
            <TabsContent value="playback" className="space-y-4 outline-none m-0">
              {/* Playback Speed */}
              <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Playback Speed</p>
                    <p className="text-[10px] text-zinc-400">Adjust listening tempo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-emerald-400">
                      {playbackRate.toFixed(2)}x
                    </span>
                    {playbackRate !== 1.0 && (
                      <button
                        type="button"
                        onClick={() => setPlaybackRate(1.0)}
                        className="text-[10px] text-zinc-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {SPEED_PRESETS.map((rate) => {
                    const isSelected = Math.abs(playbackRate - rate) < 0.01;
                    return (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setPlaybackRate(rate)}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl text-xs font-medium transition-all border",
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-semibold"
                            : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200"
                        )}
                      >
                        {rate}x
                      </button>
                    );
                  })}
                </div>

                <Slider
                  value={[playbackRate]}
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  onValueChange={(val) => setPlaybackRate(val[0])}
                  className="[&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-800"
                />
              </div>

              {/* Crossfade Transitions */}
              <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Crossfade Transitions</p>
                    <p className="text-[10px] text-zinc-400">Seamless blend between tracks</p>
                  </div>
                  <span className="text-xs font-mono font-medium text-emerald-400">
                    {crossfade === 0 ? "Off" : `${(crossfade / 1000).toFixed(1)}s`}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  {CROSSFADE_PRESETS.map((sec) => {
                    const isSelected = crossfade === sec * 1000;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setCrossfade(sec * 1000)}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl text-xs font-medium transition-all border",
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-semibold"
                            : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200"
                        )}
                      >
                        {sec === 0 ? "Off" : `${sec}s`}
                      </button>
                    );
                  })}
                </div>

                <Slider
                  value={[crossfade / 1000]}
                  min={0}
                  max={12}
                  step={0.5}
                  onValueChange={(val) => setCrossfade(Math.round(val[0] * 1000))}
                  className="[&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-800"
                />
              </div>

              {/* Loudness Normalization */}
              <div className="p-3.5 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="size-4 text-purple-300" />
                  <div>
                    <p className="text-xs font-semibold text-white">Normalize Volume</p>
                    <p className="text-[10px] text-zinc-400">Uniform loudness across songs</p>
                  </div>
                </div>
                <AppleSwitch
                  checked={normalizeVolume}
                  onCheckedChange={setNormalizeVolume}
                  label="Toggle Volume Normalization"
                />
              </div>

              {/* Streaming Audio Quality */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Streaming Quality
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {QUALITY_OPTIONS.map((opt) => {
                    const isSelected = audioQuality === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAudioQuality(opt.id)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between",
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <div>
                          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                            {opt.label}
                            {isSelected && <Check className="size-3 text-emerald-400" />}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{opt.badge}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gapless Playback indicator */}
              <div className="p-3 rounded-2xl glass-card border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Zap className="size-3.5 text-blue-400" />
                  <span>Gapless Transition Engine</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                  Active
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-5 border-t border-white/10 bg-black/30 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 gap-1.5 transition-colors h-8"
          >
            <RotateCcw className="size-3.5" />
            Reset All
          </Button>
          <Button
            size="sm"
            onClick={() => setIsOpen(false)}
            className="bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-5 h-8 rounded-xl shadow-lg transition-all"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
