import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, ChevronDown, ShieldCheck, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { initials } from "@/lib/format";

interface UserMenuProps {
  showDetails?: boolean;
}

export const UserMenu = ({ showDetails = false }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const signOut = useAuthStore((state) => state.signOut);
  const resetLibrary = useLibraryStore((state) => state.reset);
  const navigate = useNavigate();

  // If user is null but this is rendered, fallback gracefully
  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";
  const userInitials = initials(displayName);

  const handleSignOut = async () => {
    await signOut();
    resetLibrary();
    setOpen(false);
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {showDetails ? (
          <button
            type="button"
            aria-label="Open account menu"
            className="flex items-center gap-2.5 rounded-full glass-pill py-1 pl-1 pr-3 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
          >
            <Avatar className="size-8 border border-white/20">
              <AvatarImage src={user?.imageUrl} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[130px]">
                {displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <p className="text-[10px] text-emerald-400 font-medium leading-none">
                  {isAdmin ? "Admin" : "Listener"}
                </p>
              </div>
            </div>
            <ChevronDown className="size-3.5 text-zinc-400 hidden sm:block ml-0.5" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open account menu"
            className="rounded-full ring-emerald-400 transition hover:ring-2 focus-visible:ring-2 focus-visible:outline-none active:scale-95"
          >
            <Avatar className="size-8 border border-white/20">
              <AvatarImage src={user?.imageUrl} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="border-white/10 glass-dock text-white sm:max-w-sm p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3.5">
            <Avatar className="size-14 border border-white/20 shadow-md">
              <AvatarImage src={user?.imageUrl} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-base">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="truncate text-base font-bold text-white">
                  {displayName}
                </DialogTitle>
                {isAdmin && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 gap-1">
                    <ShieldCheck className="size-3" /> Admin
                  </Badge>
                )}
              </div>
              <DialogDescription className="truncate text-zinc-400 text-xs flex items-center gap-1 mt-1">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{user?.email || "No email"}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 mt-4 pt-3 border-t border-white/10">
          {isAdmin && (
            <Button
              asChild
              variant="secondary"
              className="w-full justify-start glass-pill text-white hover:text-white gap-2.5 text-xs h-9"
            >
              <Link to="/admin" onClick={() => setOpen(false)}>
                <LayoutDashboard className="size-4 text-emerald-400" />
                Admin Command Center
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start glass-pill text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2.5 text-xs h-9"
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
