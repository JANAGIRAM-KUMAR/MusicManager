import { useState } from "react";
import { SignInButton } from "@/components/SignInButton";
import { ListMusic, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoverImage } from "@/components/CoverImage";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import type { Song } from "@/types";

interface PlaylistPickerDialogProps {
  song: Song | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistPickerDialog = ({
  song,
  open,
  onOpenChange,
}: PlaylistPickerDialogProps) => {
  const isSignedIn = Boolean(useAuthStore((state) => state.user));
  const playlists = useLibraryStore((state) => state.playlists);
  const addSongToPlaylist = useLibraryStore((state) => state.addSongToPlaylist);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const [title, setTitle] = useState("");

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const playlist = await createPlaylist(trimmed);
    if (playlist && song) {
      await addSongToPlaylist(playlist._id, song._id);
    }
    setTitle("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to playlist</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {song ? `Choose a playlist for "${song.title}".` : "Choose a playlist."}
          </DialogDescription>
        </DialogHeader>

        {!isSignedIn ? (
          <div className="py-6 text-center text-sm text-zinc-400">
            <p>Sign in to create playlists and save songs.</p>
            <SignInButton>
              <Button className="mt-4 rounded-full bg-white text-black hover:bg-zinc-200">
                Sign in
              </Button>
            </SignInButton>
          </div>
        ) : (
          <>
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {playlists.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">
              You have no playlists yet.
            </p>
          )}
          {playlists.map((playlist) => (
            <button
              key={playlist._id}
              type="button"
              className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-zinc-800"
              onClick={() => {
                if (!song) return;
                void addSongToPlaylist(playlist._id, song._id);
                onOpenChange(false);
              }}
            >
              <CoverImage
                src={playlist.imageUrl}
                alt={playlist.title}
                fallbackLabel={playlist.title}
                className="size-10 shrink-0 rounded"
              />
              <span className="min-w-0 flex-1 truncate text-sm">{playlist.title}</span>
              <ListMusic className="size-4 text-zinc-500" />
            </button>
          ))}
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCreate();
              }}
              placeholder="New playlist name"
              className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
            <Button onClick={() => void handleCreate()} disabled={!title.trim()}>
              <Plus className="size-4" />
              Create
            </Button>
          </div>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
