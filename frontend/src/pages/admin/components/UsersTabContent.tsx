import { useEffect, useState } from "react";
import { Trash2, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/useAuthStore";
import type { User } from "@/types";

export default function UsersTabContent() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteUser = async (user: User) => {
    if (user._id === currentUser?._id) {
      toast.error("You cannot delete yourself");
      return;
    }
    if (!confirm(`Delete user ${user.fullName}?`)) return;
    try {
      await axiosInstance.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success("User deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <p className="text-sm text-zinc-400">{users.length} users</p>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
        <ScrollArea className="h-[500px]">
          <div className="divide-y divide-zinc-800">
            {loading && (
              <div className="p-6 text-center text-zinc-400">Loading...</div>
            )}
            {!loading && users.length === 0 && (
              <div className="p-6 text-center text-zinc-400">No users found</div>
            )}
            {!loading &&
              users.map((user) => (
                <div key={user._id} className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.fullName} className="size-10 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="size-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{user.fullName}</p>
                    <p className="truncate text-sm text-zinc-400">{user.email}</p>
                  </div>
                  <p className="hidden text-xs text-zinc-500 sm:block">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteUser(user)}
                    disabled={user._id === currentUser?._id}
                    className="text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
