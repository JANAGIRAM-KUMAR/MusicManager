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
    <div className="flex h-screen flex-col gap-2 bg-black p-2 text-white">
      <div className="flex min-h-0 flex-1 gap-2">
        {isSignedIn && (
          <aside className="hidden w-[280px] shrink-0 md:block">
            <LeftSidebar />
          </aside>
        )}

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-zinc-900">
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
              className="fixed inset-0 z-30 cursor-default bg-black/60 lg:hidden"
              onClick={() => setQueueOpen(false)}
            />
            <aside className="fixed top-2 right-2 bottom-[96px] z-40 w-[340px] max-w-[90vw] lg:static lg:z-auto lg:w-[360px] lg:shrink-0 lg:bottom-auto">
              <QueuePanel />
            </aside>
          </>
        )}
      </div>

      <PlayerBar />
    </div>
  );
};

export default MainLayout;
