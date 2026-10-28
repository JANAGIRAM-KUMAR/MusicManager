import { useEffect, useState, useMemo } from "react";
import { Trash2, User as UserIcon, Search, ShieldCheck, UserCheck, Heart, ListMusic, Headphones, Calendar, Users } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/useAuthStore";
import type { User } from "@/types";

export default function UsersTabContent() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.authProvider?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const deleteUser = async (user: User) => {
    if (user._id === currentUser?._id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete user "${user.fullName}" (${user.email})?`)) return;
    try {
      await axiosInstance.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success("User deleted successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header and Controls */}
      <CardHeader className="border-b border-zinc-800/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Users className="size-5 text-sky-400" />
              User Accounts Directory
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              {users.length} registered community listeners and administrators
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800/80 border-zinc-700 h-9 text-xs text-white"
            />
          </div>
        </div>
      </CardHeader>

      {/* Users Table / List */}
      <CardContent className="p-0">
        <ScrollArea className="h-[480px]">
          {loading && (
            <div className="p-12 text-center text-zinc-400">Loading user directory...</div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              {searchQuery ? "No users matching your search" : "No users registered yet"}
            </div>
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="divide-y divide-zinc-800/80">
              {filteredUsers.map((user) => {
                const isCurrent = user._id === currentUser?._id;
                return (
                  <div
                    key={user._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-zinc-800/30 transition"
                  >
                    {/* User Identity */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative size-11 rounded-full bg-zinc-800 border border-zinc-700/60 grid place-items-center overflow-hidden shrink-0">
                        {user.imageUrl ? (
                          <img src={user.imageUrl} alt={user.fullName} className="size-full object-cover" />
                        ) : (
                          <UserIcon className="size-5 text-zinc-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white truncate text-sm">
                            {user.fullName}
                          </p>
                          {isCurrent && (
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 text-[10px] py-0">
                              You
                            </Badge>
                          )}
                          {user.isAdmin ? (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] py-0 gap-1 flex items-center">
                              <ShieldCheck className="size-3" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] py-0 gap-1 flex items-center">
                              <UserCheck className="size-3" /> Listener
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] py-0 uppercase bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                            {user.authProvider || "local"}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-zinc-400 mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    {/* User Metrics & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1.5" title="Playlists created">
                          <ListMusic className="size-3.5 text-indigo-400" />
                          <span className="tabular-nums font-medium text-zinc-300">{user.playlistCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Songs liked">
                          <Heart className="size-3.5 text-pink-400" />
                          <span className="tabular-nums font-medium text-zinc-300">{user.likesCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Total streams">
                          <Headphones className="size-3.5 text-rose-400" />
                          <span className="tabular-nums font-medium text-zinc-300">{user.playsCount ?? 0}</span>
                        </div>
                      </div>

                      <div className="hidden lg:flex items-center gap-1 text-xs text-zinc-500 w-24">
                        <Calendar className="size-3" />
                        <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUser(user)}
                        disabled={isCurrent}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                        title={isCurrent ? "Cannot delete yourself" : "Delete user"}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
