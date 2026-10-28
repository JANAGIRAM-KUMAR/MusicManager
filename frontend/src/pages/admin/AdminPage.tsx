import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Album, Music, Users, ListMusic, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { greeting } from "@/lib/format";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import SongsTabContent from "./components/SongsTabContent";
import AlbumsTabContent from "./components/AlbumsTabContent";
import UsersTabContent from "./components/UsersTabContent";
import PlaylistsTabContent from "./components/PlaylistsTabContent";

const AdminPage = () => {
    const { user, isAdmin, isLoading } = useAuthStore();
    const { fetchAlbums, fetchSongs, fetchStats, songs, albums, adminPlaylists, stats } = useMusicStore();

    useEffect(() => {
        fetchAlbums();
        fetchSongs();
        fetchStats();
    }, [fetchAlbums, fetchSongs, fetchStats]);

    // Cleanup any lingering modal backdrops or scroll-locks when mounting admin dashboard
    useEffect(() => {
        window.dispatchEvent(new CustomEvent("spotify:close-all-dialogs"));
        if (typeof document !== "undefined") {
            document.body.style.pointerEvents = "";
            document.body.style.overflow = "";
            document.body.removeAttribute("data-scroll-locked");
        }
    }, []);

    if (!isAdmin && !isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white p-4">
                <div className="text-center p-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl max-w-md shadow-2xl">
                    <div className="size-12 rounded-full bg-red-500/10 text-red-400 grid place-items-center mx-auto mb-3">
                        <Users className="size-6" />
                    </div>
                    <p className="text-xl font-bold text-white">Access Restricted</p>
                    <p className="text-sm text-zinc-400 mt-2">
                        You need administrator permissions to view this dashboard. Please sign in with an authorized administrator account.
                    </p>
                    <Button asChild className="mt-6 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold w-full">
                        <Link to="/">Return to Player</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const adminName = user?.fullName || user?.email?.split("@")[0] || "Admin";

    return (
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-x-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))]" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Modern Topbar with Logo and Profile Pill */}
                <Header />

                {/* Hero Greeting Section */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-950 p-6 rounded-2xl border border-zinc-800/80 shadow-sm backdrop-blur-sm">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5">
                                <Sparkles className="size-3.5" /> Platform Intelligence
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                            {greeting()}, {adminName}
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            Monitor platform streams, curate music albums, and administer community users.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right hidden md:block mr-2">
                            <p className="text-xs text-zinc-500">System Status</p>
                            <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 justify-end mt-0.5">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                All systems operational
                            </p>
                        </div>
                    </div>
                </div>

                {/* Structured Metrics Section */}
                <DashboardStats />

                {/* Navigation Tabs for Catalog & User Management */}
                <Tabs defaultValue='songs' className='space-y-6'>
                    <div className="flex items-center justify-between overflow-x-auto pb-1">
                        <TabsList className='p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl inline-flex gap-1 shadow-inner'>
                            <TabsTrigger
                                value="songs"
                                className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all gap-2"
                            >
                                <Music className="size-4"/>
                                Songs ({songs.length})
                            </TabsTrigger>

                            <TabsTrigger
                                value="albums"
                                className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all gap-2"
                            >
                                <Album className="size-4"/>
                                Albums ({albums.length})
                            </TabsTrigger>

                            <TabsTrigger
                                value="playlists"
                                className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all gap-2"
                            >
                                <ListMusic className="size-4"/>
                                Playlists ({adminPlaylists.length || stats?.totalPlaylists || 0})
                            </TabsTrigger>

                            <TabsTrigger
                                value="users"
                                className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all gap-2"
                            >
                                <Users className="size-4"/>
                                Users ({stats?.totalUsers || 0})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value='songs' className="outline-none">
                        <SongsTabContent />
                    </TabsContent>

                    <TabsContent value='albums' className="outline-none">
                        <AlbumsTabContent />
                    </TabsContent>

                    <TabsContent value='playlists' className="outline-none">
                        <PlaylistsTabContent />
                    </TabsContent>

                    <TabsContent value='users' className="outline-none">
                        <UsersTabContent />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminPage;
