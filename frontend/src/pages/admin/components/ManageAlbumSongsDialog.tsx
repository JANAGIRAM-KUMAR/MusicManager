import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMusicStore } from "@/stores/useMusicStore";
import type { Album } from "@/types";
import { Music, Plus, Trash2, Search, Check, Disc, Clock, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/format";

interface ManageAlbumSongsDialogProps {
  album: Album;
}

export default function ManageAlbumSongsDialog({ album }: ManageAlbumSongsDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"current" | "add">("current");

  const { songs, albums, addSongsToAlbum, removeSongFromAlbum, isLoading, fetchSongs, fetchAlbums } = useMusicStore();

  // Always use the live album instance from store
  const liveAlbum = useMemo(() => {
    return albums.find((a) => a._id === album._id) || album;
  }, [albums, album]);

  // Refresh songs and albums when the dialog is opened
  useEffect(() => {
    if (open) {
      void fetchSongs();
      void fetchAlbums();
    }
  }, [open, fetchSongs, fetchAlbums]);

  // Set of song IDs currently associated with this album
  const currentSongIds = useMemo(() => {
    const fromAlbumSongs = (liveAlbum.songs || []).map((s: any) =>
      typeof s === "string" ? s : String(s?._id || s)
    );
    const fromSongsList = songs
      .filter((s) => s.albumId === liveAlbum._id || (s.albumIds && s.albumIds.includes(liveAlbum._id)))
      .map((s) => String(s._id));

    return new Set([...fromAlbumSongs, ...fromSongsList]);
  }, [liveAlbum, songs]);

  // Current songs populated
  const currentSongsInAlbum = useMemo(() => {
    return songs.filter((s) => currentSongIds.has(String(s._id)));
  }, [songs, currentSongIds]);

  // Available library songs not yet in this album
  const availableSongs = useMemo(() => {
    return songs.filter((s) => !currentSongIds.has(String(s._id)));
  }, [songs, currentSongIds]);

  // Filtered available songs by search query
  const filteredAvailableSongs = useMemo(() => {
    if (!searchQuery.trim()) return availableSongs;
    const q = searchQuery.toLowerCase();
    return availableSongs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [availableSongs, searchQuery]);

  const toggleSelectSong = (songId: string) => {
    setSelectedToAdd((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleAddSelected = async () => {
    if (selectedToAdd.length === 0) return;
    await addSongsToAlbum(liveAlbum._id, selectedToAdd);
    setSelectedToAdd([]);
    setActiveTab("current");
  };

  const handleQuickAdd = async (songId: string) => {
    await addSongsToAlbum(liveAlbum._id, [songId]);
  };

  const handleRemoveSong = async (songId: string) => {
    await removeSongFromAlbum(liveAlbum._id, songId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
        >
          <Music className="size-4" />
          <span className="hidden sm:inline">Manage Songs</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 p-6 border-b border-zinc-800">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <img
                src={liveAlbum.imageUrl}
                alt={liveAlbum.title}
                className="size-16 rounded-lg object-cover shadow-lg border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 mb-1 text-[10px] uppercase font-bold tracking-wider">
                  Album Tracklist Manager
                </Badge>
                <DialogTitle className="text-xl font-bold truncate text-white">{liveAlbum.title}</DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs mt-0.5">
                  Artist: {liveAlbum.artist} • {currentSongsInAlbum.length} {currentSongsInAlbum.length === 1 ? "song" : "songs"} attached
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Navigation Sub-Tabs */}
          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "current"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Current Tracks ({currentSongsInAlbum.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "add"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              + Add from Library ({availableSongs.length} available)
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4">
          {activeTab === "current" ? (
            <div>
              <div className="flex items-center justify-between mb-3 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold px-1">
                <span>Song Title & Artist</span>
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-1"><Clock className="size-3" /> Duration</span>
                  <span>Remove</span>
                </div>
              </div>

              <ScrollArea className="h-[320px] pr-2">
                {currentSongsInAlbum.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-400">
                    <Disc className="size-10 mb-2 text-zinc-600" />
                    <p className="font-semibold text-white text-sm">No songs in this album yet</p>
                    <p className="text-xs text-zinc-500 mt-1">Switch to the "Add from Library" tab to assign songs</p>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("add")}
                      className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs"
                    >
                      <Plus className="size-3.5 mr-1" /> Add Songs Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {currentSongsInAlbum.map((song, index) => (
                      <div
                        key={song._id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/80 transition group border border-transparent hover:border-zinc-700/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-zinc-500 w-5 text-center">
                            {index + 1}
                          </span>
                          <img
                            src={song.imageUrl}
                            alt={song.title}
                            className="size-9 rounded object-cover shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate text-white">{song.title}</p>
                            <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-zinc-400 tabular-nums font-mono">
                            {formatTime(song.duration)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isLoading}
                            onClick={() => handleRemoveSong(song._id)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                            title="Remove track from this album"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div>
              {/* Search & Batch Actions */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Search library songs by title or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-zinc-800/80 border-zinc-700 h-9 text-xs"
                  />
                </div>
                {selectedToAdd.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAddSelected}
                    disabled={isLoading}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shrink-0 text-xs h-9"
                  >
                    {isLoading ? (
                      <Loader2 className="size-3.5 mr-1 animate-spin" />
                    ) : (
                      <Plus className="size-3.5 mr-1" />
                    )}
                    Add Selected ({selectedToAdd.length})
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[320px] pr-2">
                {filteredAvailableSongs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-400">
                    <Music className="size-10 mb-2 text-zinc-600" />
                    <p className="font-semibold text-white text-sm">No available songs found</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {searchQuery ? "Try a different search query" : "All songs in your library are already in this album"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredAvailableSongs.map((song) => {
                      const isSelected = selectedToAdd.includes(song._id);
                      return (
                        <div
                          key={song._id}
                          onClick={() => toggleSelectSong(song._id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500/50"
                              : "bg-zinc-800/40 border-transparent hover:bg-zinc-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`size-4.5 rounded border grid place-items-center transition ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-black"
                                  : "border-zinc-600 bg-zinc-900"
                              }`}
                            >
                              {isSelected && <Check className="size-3 stroke-[3]" />}
                            </div>
                            <img
                              src={song.imageUrl}
                              alt={song.title}
                              className="size-9 rounded object-cover shadow-sm"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate text-white">{song.title}</p>
                              <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-400 tabular-nums font-mono">
                              {formatTime(song.duration)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAdd(song._id);
                              }}
                              className="h-7 text-xs border-zinc-700 hover:border-emerald-500 hover:text-emerald-400"
                            >
                              <Plus className="size-3 mr-1" /> Add
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
