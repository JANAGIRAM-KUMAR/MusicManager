import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { CoverImage } from "@/components/CoverImage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLibraryStore } from "@/stores/useLibraryStore";

export const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const signOut = useAuthStore((state) => state.signOut);
  const resetLibrary = useLibraryStore((state) => state.reset);
  const navigate = useNavigate();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    resetLibrary();
    setOpen(false);
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="rounded-full ring-emerald-400 transition hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
        >
          <CoverImage
            src={user.imageUrl}
            alt={user.fullName}
            fallbackLabel={user.fullName}
            className="size-8 rounded-full"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CoverImage
              src={user.imageUrl}
              alt={user.fullName}
              fallbackLabel={user.fullName}
              className="size-12 rounded-full"
            />
            <div className="min-w-0">
              <DialogTitle className="truncate">{user.fullName}</DialogTitle>
              <DialogDescription className="truncate text-zinc-400">
                {user.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          {isAdmin && (
            <Button
              asChild
              variant="secondary"
              className="w-full justify-start bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <Link to="/admin" onClick={() => setOpen(false)}>
                <LayoutDashboard className="size-4" />
                Admin dashboard
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start bg-zinc-800 text-white hover:bg-zinc-700"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
