import { useEffect, useRef, useState } from "react";
import { X, Mic2 } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import axiosInstance from "@/lib/axios";

export const LyricsPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const [plain, setPlain] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentSong || !open) return;
      setLoading(true);
      setPlain("");
      try {
        const res = await axiosInstance.get("/lyrics", {
          params: {
            artist: currentSong.artist,
            track: currentSong.title,
            duration: Math.round(currentSong.duration || 0),
            album: (currentSong as any).album || "",
          },
        });
        if (res.data?.success && res.data?.lyrics) {
          setPlain(res.data.lyrics.plainLyrics || "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLyrics();
  }, [currentSong?._id, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-[86px] top-0 z-40 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Mic2 className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">{currentSong?.title}</p>
              <p className="truncate text-xs text-zinc-400 sm:text-sm">{currentSong?.artist}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white">
            <X className="size-5" />
          </button>
        </div>
        <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
            </div>
          )}
          {!loading && plain && (
            <div className="mx-auto max-w-3xl whitespace-pre-wrap text-center text-lg leading-[2] text-zinc-100 sm:text-xl md:text-2xl lg:text-3xl">
              {plain}
            </div>
          )}
          {!loading && !plain && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Mic2 className="mb-4 size-10 text-zinc-600" />
              <p className="text-lg font-semibold">No lyrics available</p>
              <p className="mt-1 text-sm text-zinc-500">Lyrics not found for this track</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
