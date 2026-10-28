import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { parseLrc, type LyricLine } from "@/lib/lrcParser";

export interface LyricsState {
  syncedLines: LyricLine[];
  plainLyrics: string;
  isInstrumental: boolean;
  loading: boolean;
  error: boolean;
}

const lyricsCache = new Map<
  string,
  { syncedLines: LyricLine[]; plainLyrics: string; isInstrumental: boolean }
>();

export const useLyrics = (
  songId?: string,
  track?: string,
  artist?: string,
  duration?: number
): LyricsState => {
  const cacheKey = songId || `${artist}-${track}`;

  const cached = cacheKey ? lyricsCache.get(cacheKey) : undefined;

  const [state, setState] = useState<LyricsState>({
    syncedLines: cached?.syncedLines || [],
    plainLyrics: cached?.plainLyrics || "",
    isInstrumental: cached?.isInstrumental || false,
    loading: !cached && Boolean(track && artist),
    error: false,
  });

  useEffect(() => {
    if (!track || !artist) {
      setState({
        syncedLines: [],
        plainLyrics: "",
        isInstrumental: false,
        loading: false,
        error: false,
      });
      return;
    }

    if (cacheKey && lyricsCache.has(cacheKey)) {
      const hit = lyricsCache.get(cacheKey)!;
      setState({
        syncedLines: hit.syncedLines,
        plainLyrics: hit.plainLyrics,
        isInstrumental: hit.isInstrumental,
        loading: false,
        error: false,
      });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: false }));

    const fetchLyrics = async () => {
      try {
        const res = await axiosInstance.get("/lyrics", {
          params: {
            artist,
            track,
            duration: Math.round(duration || 0),
          },
        });

        if (cancelled) return;

        if (res.data?.success && res.data?.lyrics) {
          const { syncedLyrics, plainLyrics: plain, instrumental } = res.data.lyrics;
          const parsedLines = syncedLyrics ? parseLrc(syncedLyrics) : [];
          const data = {
            syncedLines: parsedLines,
            plainLyrics: plain || "",
            isInstrumental: Boolean(instrumental),
          };

          if (cacheKey) {
            lyricsCache.set(cacheKey, data);
          }

          setState({
            ...data,
            loading: false,
            error: false,
          });
        } else {
          setState({
            syncedLines: [],
            plainLyrics: "",
            isInstrumental: false,
            loading: false,
            error: false,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Could not load lyrics:", err);
          setState({
            syncedLines: [],
            plainLyrics: "",
            isInstrumental: false,
            loading: false,
            error: true,
          });
        }
      }
    };

    void fetchLyrics();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, track, artist, duration]);

  return state;
};
