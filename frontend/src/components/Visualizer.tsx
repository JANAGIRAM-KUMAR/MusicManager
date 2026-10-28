import { useEffect, useRef } from "react";
import { audioEngine } from "@/lib/audioEngine";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";

interface VisualizerProps {
  className?: string;
  bars?: number;
}

export const Visualizer = ({ className, bars = 24 }: VisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentSong = usePlayerStore((state) => state.currentSong);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let destroyed = false;
    const smoothedValues = new Float32Array(bars).fill(0.06);

    const updateDimensions = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 64;
      const height = canvas.clientHeight || 28;

      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }
      return { width, height, ratio };
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(canvas);
    }

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

      if (analyser && isPlaying) {
        const binCount = analyser.frequencyBinCount;
        const frequencyData = new Uint8Array(binCount);
        analyser.getByteFrequencyData(frequencyData);

        // Check if frequency data has non-zero amplitude
        let totalEnergy = 0;
        for (let i = 0; i < binCount; i++) {
          totalEnergy += frequencyData[i];
        }

        if (totalEnergy > 0) {
          hasRealAudio = true;
          // Distribute frequency bins musically across bars (focusing on low-to-mid frequencies)
          const usableBins = Math.floor(binCount * 0.85);

          for (let index = 0; index < bars; index++) {
            const startBin = Math.floor((index / bars) * usableBins);
            const endBin = Math.max(startBin + 1, Math.floor(((index + 1) / bars) * usableBins));

            let sum = 0;
            for (let b = startBin; b < endBin; b++) {
              sum += frequencyData[b];
            }
            const rawVal = sum / ((endBin - startBin) * 255);

            // Fast attack, smooth decay
            const targetVal = Math.min(1, Math.max(0.08, rawVal * 1.35));
            if (targetVal > smoothedValues[index]) {
              smoothedValues[index] = targetVal;
            } else {
              smoothedValues[index] = smoothedValues[index] * 0.82 + targetVal * 0.18;
            }
          }
        }
      }

      // If paused, stopped, or waiting for audio stream, smoothly decay to idle baseline
      if (!hasRealAudio) {
        for (let index = 0; index < bars; index++) {
          const idleBaseline = isPlaying
            ? 0.15 + 0.1 * Math.sin(Date.now() / 200 + index * 0.5)
            : 0.06;
          smoothedValues[index] = Math.max(0.04, smoothedValues[index] * 0.88 + idleBaseline * 0.12);
        }
      }

      const gap = 2;
      const barWidth = Math.max(2, (width - gap * (bars - 1)) / bars);

      // Emerald Green Visualizer Gradient
      const gradient = context.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.4)");
      gradient.addColorStop(1, "rgba(52, 211, 153, 0.95)");
      context.fillStyle = gradient;

      for (let index = 0; index < bars; index++) {
        const val = smoothedValues[index];
        const barHeight = Math.max(2, Math.min(height, val * height));
        const x = index * (barWidth + gap);
        const y = height - barHeight;

        context.beginPath();
        if (typeof context.roundRect === "function") {
          context.roundRect(x, y, barWidth, barHeight, Math.min(barWidth / 2, 2));
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
        frameRef.current = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [bars, isPlaying, currentSong?._id]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-7 w-16 shrink-0", className)}
      aria-hidden="true"
    />
  );
};
