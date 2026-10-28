import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import { PlayerBar } from "./components/PlayerBar";
import { QueuePanel } from "./components/QueuePanel";
import { MobileNav } from "./components/MobileNav";
import { LyricsPanel } from "@/components/lyrics/LyricsPanel";
import { AudioSettingsDialog } from "@/components/audio/AudioSettingsDialog";
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
    <div className="relative flex h-[100dvh] flex-col gap-1 bg-[#08090d] text-white sm:gap-2 sm:p-2 overflow-hidden">
      {/* Apple Ambient Fluid Mesh Atmosphere */}
      <div className="pointer-events-none fixed -top-48 -left-48 size-[560px] rounded-full bg-emerald-500/12 blur-[140px]" />
      <div className="pointer-events-none fixed top-1/3 -right-48 size-[600px] rounded-full bg-indigo-600/10 blur-[160px]" />
      <div className="pointer-events-none fixed -bottom-48 left-1/3 size-[520px] rounded-full bg-teal-500/10 blur-[150px]" />

      <div className="relative z-10 flex min-h-0 flex-1 gap-2 overflow-hidden">
        {/* Desktop Left Sidebar */}
        {isSignedIn && (
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <LeftSidebar />
          </aside>
        )}

        {/* Central Viewport */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-none sm:rounded-2xl glass-panel shadow-2xl">
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
              className="fixed inset-0 z-40 cursor-default bg-black/60 lg:hidden backdrop-blur-sm"
              onClick={() => setQueueOpen(false)}
            />
            <aside className="fixed inset-x-2 bottom-[130px] top-4 z-40 sm:inset-auto sm:top-2 sm:right-2 sm:bottom-[96px] sm:w-[340px] lg:static lg:z-auto lg:w-[360px] lg:shrink-0 lg:bottom-auto rounded-2xl overflow-hidden glass-panel">
              <QueuePanel />
            </aside>
          </>
        )}
      </div>

      {/* Player Bar Container: Fixed floating on mobile, standard bottom dock on tablet/desktop */}
      <div className={`fixed sm:static ${currentSong ? 'bottom-[74px] sm:bottom-auto' : 'hidden sm:block'} inset-x-3 sm:inset-auto z-30 sm:z-auto px-0`}>
        <PlayerBar />
      </div>

      {/* Mobile Bottom Navigation Bar (< lg screens) */}
      <MobileNav />

      {/* Global Synchronized Karaoke Lyrics View */}
      <LyricsPanel />

      {/* Global Studio Playback & Audio Settings Dialog */}
      <AudioSettingsDialog />
    </div>
  );
};

export default MainLayout;
