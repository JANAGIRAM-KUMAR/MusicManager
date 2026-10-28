import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import { PlayerBar } from "./components/PlayerBar";
import { QueuePanel } from "./components/QueuePanel";
import { MobileNav } from "./components/MobileNav";
import Topbar from "@/components/Topbar";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

import { audioEngine } from "@/lib/audioEngine";

const MainLayout = () => {
  const user = useAuthStore((state) => state.user);
  const isSignedIn = Boolean(user);
  const queueOpen = usePlayerStore((state) => state.queueOpen);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);
  const resetLibrary = useLibraryStore((state) => state.reset);

  const location = useLocation();

  // Safari/iOS user interaction unlock
  useEffect(() => {
    const unlock = () => {
      audioEngine.unlock();
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("click", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  // Cleanup dialogs, overlays, and body scroll locks whenever route changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("spotify:close-all-dialogs"));
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      document.body.removeAttribute("data-scroll-locked");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isSignedIn) {
      void fetchLibrary();
    } else {
      resetLibrary();
    }
  }, [fetchLibrary, isSignedIn, resetLibrary]);

  return (
    <div className="flex h-[100dvh] flex-col gap-1 bg-black text-white sm:gap-2 sm:p-2 overflow-hidden">
      <div className="flex min-h-0 flex-1 gap-2 overflow-hidden">
        {/* Desktop Left Sidebar */}
        {isSignedIn && (
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <LeftSidebar />
          </aside>
        )}

        {/* Central Viewport */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-none bg-zinc-900 sm:rounded-xl">
          <Topbar />
          <div className="min-h-0 flex-1 overflow-y-auto pb-36 sm:pb-6">
            <Outlet />
          </div>
        </main>

        {/* Queue Drawer / Panel */}
        {queueOpen && (
          <>
            <button
              type="button"
              aria-label="Close queue"
              className="fixed inset-0 z-40 cursor-default bg-black/70 lg:hidden backdrop-blur-xs"
              onClick={() => setQueueOpen(false)}
            />
            <aside className="fixed inset-x-2 bottom-[130px] top-4 z-40 sm:inset-auto sm:top-2 sm:right-2 sm:bottom-[96px] sm:w-[340px] lg:static lg:z-auto lg:w-[360px] lg:shrink-0 lg:bottom-auto">
              <QueuePanel />
            </aside>
          </>
        )}
      </div>

      {/* Player Bar Container: Fixed floating on mobile, standard bottom dock on tablet/desktop */}
      <div className={`fixed sm:static ${currentSong ? 'bottom-[64px]' : 'hidden sm:block'} inset-x-2 z-30 sm:z-auto sm:inset-auto px-0 sm:px-0`}>
        <PlayerBar />
      </div>

      {/* Mobile Bottom Navigation Bar (< lg screens) */}
      <MobileNav />
    </div>
  );
};

export default MainLayout;
