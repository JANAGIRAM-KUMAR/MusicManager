import { useEffect, useState, useMemo } from "react";
import { Trash2, ListMusic, Search, Globe, Lock, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMusicStore } from "@/stores/useMusicStore";

export default function PlaylistsTabContent() {
  const { adminPlaylists, fetchAdminPlaylists, deleteAdminPlaylist } = useMusicStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAdminPlaylists();
      setLoading(false);
    };
    load();
  }, [fetchAdminPlaylists]);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return adminPlaylists;
    const q = searchQuery.toLowerCase();
    return adminPlaylists.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [adminPlaylists, searchQuery]);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete playlist "${title}"?`)) {
      await deleteAdminPlaylist(id);
    }
  };

  return (
    <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="border-b border-zinc-800/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <ListMusic className="size-5 text-indigo-400" />
              Community Playlists
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Monitor and moderate user-created playlists across the entire platform
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800/80 border-zinc-700 h-9 text-xs text-white"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[480px]">
          {loading && (
            <div className="p-12 text-center text-zinc-400">Loading playlists...</div>
          )}

          {!loading && filteredPlaylists.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              {searchQuery ? "No playlists matching your query" : "No user playlists found"}
            </div>
          )}

          {!loading && filteredPlaylists.length > 0 && (
            <div className="divide-y divide-zinc-800/80">
              {filteredPlaylists.map((playlist) => (
                <div
                  key={playlist._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-zinc-800/30 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="size-12 rounded-lg bg-zinc-800 border border-zinc-700/60 overflow-hidden shrink-0 grid place-items-center">
                      {playlist.imageUrl ? (
                        <img src={playlist.imageUrl} alt={playlist.title} className="size-full object-cover" />
                      ) : (
                        <ListMusic className="size-6 text-zinc-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white truncate text-sm">
                          {playlist.title}
                        </p>
                        {playlist.isPublic ? (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] py-0 gap-1 flex items-center">
                            <Globe className="size-3" /> Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] py-0 gap-1 flex items-center">
                            <Lock className="size-3" /> Private
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-zinc-400 mt-0.5">
                        {playlist.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Music className="size-3.5 text-emerald-400" />
                      <span>{(playlist.songs || []).length} songs</span>
                    </div>

                    <span className="text-xs text-zinc-500 hidden sm:inline">
                      {playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : ""}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(playlist._id, playlist.title)}
                      className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete playlist"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
