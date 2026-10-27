import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import { PlayerBar } from "./components/PlayerBar";
import { QueuePanel } from "./components/QueuePanel";
import Topbar from "@/components/Topbar";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

const MainLayout = () => {
  const user = useAuthStore((state) => state.user);
  const isSignedIn = Boolean(user);
  const queueOpen = usePlayerStore((state) => state.queueOpen);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);
  const resetLibrary = useLibraryStore((state) => state.reset);

  useEffect(() => {
    if (isSignedIn) {
      void fetchLibrary();
    } else {
      resetLibrary();
    }
  }, [fetchLibrary, isSignedIn, resetLibrary]);

  return (
    <div className="flex h-[100dvh] flex-col gap-1 bg-black text-white sm:gap-2 sm:p-2">
      <div className="flex min-h-0 flex-1 gap-2">
        {isSignedIn && (
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <LeftSidebar />
          </aside>
        )}

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-none bg-zinc-900 sm:rounded-lg">
          <Topbar />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>

        {queueOpen && (
          <>
            <button
              type="button"
              aria-label="Close queue"
              className="fixed inset-0 z-30 cursor-default bg-black/70 lg:hidden"
              onClick={() => setQueueOpen(false)}
            />
            <aside className="fixed inset-x-2 bottom-[90px] top-2 z-40 sm:inset-auto sm:top-2 sm:right-2 sm:bottom-[96px] sm:w-[340px] lg:static lg:z-auto lg:w-[360px] lg:shrink-0 lg:bottom-auto">
              <QueuePanel />
            </aside>
          </>
        )}
      </div>

      <div className="px-1 pb-1 sm:px-0 sm:pb-0">
        <PlayerBar />
      </div>
    </div>
  );
};

export default MainLayout;
