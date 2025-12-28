import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);

  const { currentSong, isPlaying, playNext } = usePlayerStore();

  // handle song change (SOURCE OF TRUTH)
    useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.songUrl) return;

    if (prevSongRef.current !== currentSong.songUrl) {
        audio.src = currentSong.songUrl;
        audio.load();
        audio.currentTime = 0;
        prevSongRef.current = currentSong.songUrl;
    }

    if (isPlaying) {
        audio.play().catch(err =>
        console.log("Play blocked:", err)
        );
    }
    }, [currentSong]);

  // handle play / pause (ONLY ONE PLACE)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(err =>
        console.log("Play blocked:", err)
      );
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // handle song end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => playNext();
    audio.addEventListener("ended", handleEnded);

    return () => audio.removeEventListener("ended", handleEnded);
  }, [playNext]);

  return <audio ref={audioRef} preload="metadata" />;
};

export default AudioPlayer;
