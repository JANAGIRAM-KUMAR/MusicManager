import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Clock3,
  Pause,
  Pencil,
  Play,
  Plus,
  Shuffle,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import { CoverImage } from "@/components/CoverImage";
import { SongRow } from "@/components/SongRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatTotalDuration } from "@/lib/format";
import type { Playlist } from "@/types";

const PlaylistPage = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const playlists = useLibraryStore((state) => state.playlists);
  const fetchPlaylists = useLibraryStore((state) => state.fetchPlaylists);
  const deletePlaylist = useLibraryStore((state) => state.deletePlaylist);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const playSongs = usePlayerStore((state) => state.playSongs);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const [playlist, setPlaylist] = useState<Playlist | null>(
    playlists.find((item) => item._id === playlistId) ?? null
  );
  const [loadedId, setLoadedId] = useState<string | null>(playlist?._id ?? null);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(playlist?.title ?? "");
  const [draftDescription, setDraftDescription] = useState(playlist?.description ?? "");

  useEffect(() => {
    if (!playlistId) return;
    let cancelled = false;

    axiosInstance
      .get(`/playlists/${playlistId}`)
      .then((response) => {
        if (cancelled) return;
        setPlaylist(response.data);
        setDraftTitle(response.data.title);
        setDraftDescription(response.data.description ?? "");
        setNotFound(false);
        setLoadedId(playlistId);
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
        setLoadedId(playlistId);
      });

    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  const isLoading = loadedId !== playlistId;
  const isOwner = Boolean(playlist && user?._id === playlist.ownerId);
  const songs = playlist?.songs ?? [];
  const totalDuration = songs.reduce((sum, song) => sum + song.duration, 0);
  const playlistPlaying = songs.some((song) => song._id === currentSong?._id);

  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;
    try {
      const response = await axiosInstance.delete(
        `/playlists/${playlist._id}/songs/${songId}`
      );
      setPlaylist(response.data);
      void fetchPlaylists();
      toast.success("Removed from playlist");
    } catch {
      toast.error("Could not remove song");
    }
  };

  const handleUpdate = async () => {
    if (!playlist) return;
    try {
      const response = await axiosInstance.patch(`/playlists/${playlist._id}`, {
        title: draftTitle.trim() || playlist.title,
        description: draftDescription.trim(),
      });
      setPlaylist(response.data);
      void fetchPlaylists();
      setEditOpen(false);
      toast.success("Playlist updated");
    } catch {
      toast.error("Could not update playlist");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-52 animate-pulse rounded-lg bg-white/5" />
        <div className="h-10 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-64 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  if (notFound || !playlist) {
    return (
      <div className="grid min-h-[50vh] place-items-center p-6 text-center text-zinc-400">
        <div>
          <p className="text-lg font-semibold text-white">Playlist not found</p>
          <Link to="/library" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
            Back to your library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-purple-600/30 via-zinc-900 to-zinc-900 pb-10">
      <header className="flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:items-end sm:text-left">
        <CoverImage
          src={playlist.imageUrl}
          alt={playlist.title}
          fallbackLabel={playlist.title}
          className="size-44 shrink-0 rounded-lg shadow-2xl sm:size-52"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide uppercase">
            {playlist.isPublic ? "Public playlist" : "Playlist"}
          </p>
          <h1 className="mt-2 text-4xl leading-none font-black tracking-tight sm:text-6xl">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-zinc-300">
              {playlist.description}
            </p>
          )}
          <p className="mt-4 text-sm text-zinc-300">
            {songs.length} songs · {formatTotalDuration(totalDuration)}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4 px-6 pb-4">
        <Button
          disabled={songs.length === 0}
          onClick={() => {
            if (playlistPlaying) togglePlay();
            else playSongs(songs, 0);
          }}
          size="icon"
          className="size-14 rounded-full bg-emerald-500 text-black shadow-xl transition hover:scale-105 hover:bg-emerald-400"
          aria-label={playlistPlaying && isPlaying ? "Pause playlist" : "Play playlist"}
        >
          {playlistPlaying && isPlaying ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="size-6 translate-x-px fill-current" />
          )}
        </Button>
        <button
          type="button"
          aria-label="Shuffle playlist"
          disabled={songs.length === 0}
          onClick={() => {
            if (!shuffle) toggleShuffle();
            if (songs.length > 0) {
              playSongs(songs, Math.floor(Math.random() * songs.length));
            }
          }}
          className="text-zinc-400 transition hover:text-white disabled:opacity-40"
        >
          <Shuffle className="size-6" />
        </button>
        <Link
          to="/search"
          className="flex items-center gap-2 rounded-full border border-zinc-600 px-4 py-2 text-sm text-zinc-200 transition hover:border-white hover:text-white"
        >
          <Plus className="size-4" />
          Add songs
        </Link>
        {isOwner && (
          <>
            <button
              type="button"
              aria-label="Edit playlist"
              onClick={() => setEditOpen(true)}
              className="grid size-9 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Delete playlist"
              onClick={async () => {
                await deletePlaylist(playlist._id);
                navigate("/library");
              }}
              className="grid size-9 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-red-400"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </div>

      <div className="px-4 sm:px-6">
        {songs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-700 p-10 text-center text-sm text-zinc-400">
            <p>This playlist is empty.</p>
            <Link to="/search" className="mt-2 inline-block text-emerald-400 hover:underline">
              Find something to add
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-2 hidden grid-cols-[2rem_4fr_2fr_auto] items-center gap-3 border-b border-white/10 px-2 pb-2 text-xs text-zinc-400 sm:grid">
              <span className="text-center">#</span>
              <span>Title</span>
              <span>Album</span>
              <span className="flex justify-end pr-16">
                <Clock3 className="size-4" />
              </span>
            </div>
            <div className="space-y-0.5">
              {songs.map((song, index) => (
                <SongRow
                  key={`${song._id}-${index}`}
                  song={song}
                  index={index}
                  isActive={currentSong?._id === song._id}
                  isPlaying={isPlaying}
                  onPlay={() => playSongs(songs, index)}
                  onRemove={isOwner ? () => void handleRemoveSong(song._id) : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit playlist</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update the name and description of your playlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Playlist name"
              className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
            <Input
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              placeholder="Description"
              className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
          </div>
          <DialogFooter>
            <Button
              className="w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400"
              onClick={() => void handleUpdate()}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistPage;
