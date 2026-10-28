import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMusicStore } from "@/stores/useMusicStore";
import type { Song } from "@/types";
import { Pencil, Loader2, X, Check, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { formatTime } from "@/lib/format";

interface EditSongDialogProps {
  song: Song;
}

export default function EditSongDialog({ song }: EditSongDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);

  // Determine initial selected album IDs
  const initialAlbumIds = song.albumIds && song.albumIds.length > 0
    ? song.albumIds
    : (song.albumId ? [song.albumId] : []);

  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>(initialAlbumIds);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { albums, updateSong } = useMusicStore();

  const toggleAlbumSelection = (albumId: string) => {
    setSelectedAlbumIds((prev) =>
      prev.includes(albumId) ? prev.filter((id) => id !== albumId) : [...prev, albumId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      toast.error("Title and artist are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSong(song._id, {
        title: title.trim(),
        artist: artist.trim(),
        duration: song.duration,
        albumIds: selectedAlbumIds,
        albumId: selectedAlbumIds.length > 0 ? selectedAlbumIds[0] : null,
      });
      setOpen(false);
    } catch {
      // Handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white hover:bg-white/10"
          title="Edit Song"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Edit Song</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update song details and album associations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-lg border border-zinc-800">
            <img src={song.imageUrl} alt={song.title} className="size-12 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-white truncate">{song.title}</p>
              <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className="bg-zinc-800/80 border-zinc-700"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1 block">Artist</label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              className="bg-zinc-800/80 border-zinc-700"
              required
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/60">
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Track Duration</span>
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  {formatTime(song.duration)} ({song.duration} seconds)
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono border-zinc-600 text-zinc-300">
              Auto
            </Badge>
          </div>

          {/* Album Multi-Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 block">
              Associated Albums ({selectedAlbumIds.length} selected)
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-zinc-800/40 rounded-md border border-zinc-700/60">
              {albums.length === 0 ? (
                <p className="text-xs text-zinc-500 py-2 text-center">No albums available</p>
              ) : (
                albums.map((album) => {
                  const isSelected = selectedAlbumIds.includes(album._id);
                  return (
                    <div
                      key={album._id}
                      onClick={() => toggleAlbumSelection(album._id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition text-xs ${
                        isSelected
                          ? "bg-emerald-500/15 text-emerald-300 font-medium"
                          : "hover:bg-zinc-700/40 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`size-4 rounded border grid place-items-center ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500 text-black"
                              : "border-zinc-600 bg-zinc-900"
                          }`}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">{album.title}</span>
                      </div>
                      <span className="text-zinc-500 text-[11px]">{album.artist}</span>
                    </div>
                  );
                })
              )}
            </div>

            {selectedAlbumIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedAlbumIds.map((id) => {
                  const album = albums.find((a) => a._id === id);
                  return album ? (
                    <Badge key={id} variant="secondary" className="gap-1 text-xs">
                      {album.title}
                      <X
                        className="size-3 cursor-pointer hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAlbumSelection(id);
                        }}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
