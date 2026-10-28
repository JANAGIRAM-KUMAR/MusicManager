import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMusicStore } from "@/stores/useMusicStore";
import type { Album } from "@/types";
import { Pencil, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface EditAlbumDialogProps {
  album: Album;
}

export default function EditAlbumDialog({ album }: EditAlbumDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(album.title);
  const [artist, setArtist] = useState(album.artist);
  const [releaseDate, setReleaseDate] = useState(album.releaseDate);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateAlbum } = useMusicStore();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      toast.error("Title and artist are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("artist", artist.trim());
      formData.append("releaseDate", releaseDate.trim());
      if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      await updateAlbum(album._id, formData);
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
          title="Edit Album"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Edit Album</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update album information and cover artwork
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Cover Art Upload / Preview */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="size-20 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 relative cursor-pointer group shrink-0"
            >
              <img
                src={previewUrl || album.imageUrl}
                alt={title}
                className="size-full object-cover group-hover:opacity-60 transition"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                <Upload className="size-5 text-white" />
              </div>
            </div>
            <div className="text-xs text-zinc-400">
              <p className="font-medium text-white mb-1">Album Cover</p>
              <p>Click image to upload a new cover image.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Album title"
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

          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1 block">Release Year / Date</label>
            <Input
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              placeholder="e.g. 2024 or 2024-05-12"
              className="bg-zinc-800/80 border-zinc-700"
              required
            />
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
