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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const analyser = audioEngine.getAnalyser();
      const frequencyData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
      if (analyser && frequencyData) {
        analyser.getByteFrequencyData(frequencyData as Uint8Array<ArrayBuffer>);
      }

      const gap = 2;
      const barWidth = Math.max(2, (width - gap * (bars - 1)) / bars);
      const gradient = context.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.35)");
      gradient.addColorStop(1, "rgba(52, 211, 153, 0.95)");
      context.fillStyle = gradient;

      for (let index = 0; index < bars; index += 1) {
        let value = 0;
        if (frequencyData && isPlaying) {
          const start = Math.floor((index / bars) * frequencyData.length * 0.75);
          const end = Math.max(start + 1, Math.floor(((index + 1) / bars) * frequencyData.length * 0.75));
          let sum = 0;
          for (let sample = start; sample < end; sample += 1) {
            sum += frequencyData[sample];
          }
          value = sum / (end - start) / 255;
        } else {
          value = 0.08 + Math.abs(Math.sin(index * 1.7)) * 0.08;
        }

        const barHeight = Math.max(2, value * height);
        const x = index * (barWidth + gap);
        context.beginPath();
        context.roundRect(x, height - barHeight, barWidth, barHeight, barWidth / 2);
        context.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [bars, isPlaying]);

  return <canvas ref={canvasRef} className={cn("h-8 w-full", className)} aria-hidden="true" />;
};
