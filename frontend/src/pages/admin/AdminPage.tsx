import { useAuthStore } from "@/stores/useAuthStore"
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Album, BarChart3, Music, Settings, Users } from "lucide-react";
import SongsTabContent from "./components/SongsTabContent";
import AlbumsTabContent from "./components/AlbumsTabContent";
import UsersTabContent from "./components/UsersTabContent";
import { useEffect } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminPage = () => {
    const {isAdmin, isLoading} = useAuthStore();
    const {fetchAlbums, fetchSongs, fetchStats} = useMusicStore();

    useEffect(() => {
        fetchAlbums();
        fetchSongs();
        fetchStats();
    },[fetchAlbums, fetchSongs, fetchStats]);
    if(!isAdmin && !isLoading){
        return <div className="flex min-h-screen items-center justify-center bg-black text-white">Unauthorized</div>
    }
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950
   to-black text-zinc-100">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <Header />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">Overview</h2>
                    <p className="text-sm text-zinc-400">Monitor and manage your music platform</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="border-zinc-700 bg-transparent">
                        <Link to="/"><BarChart3 className="mr-2 size-4" />View Site</Link>
                    </Button>
                </div>
            </div>
            <DashboardStats />
            <Tabs defaultValue='songs' className='space-y-6 mt-6'>
                <TabsList className='p-1 bg-zinc-900/80 border border-zinc-800'>
                    <TabsTrigger value="songs" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
                        <Music className="mr-2 size-4"/>
                        Songs
                    </TabsTrigger>
                    <TabsTrigger value="albums" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
                        <Album className="mr-2 size-4"/>
                        Albums
                    </TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
                        <Users className="mr-2 size-4"/>
                        Users
                    </TabsTrigger>
                </TabsList>
                <TabsContent value='songs'>
                    <SongsTabContent />
                </TabsContent>
                <TabsContent value='albums'>
                    <AlbumsTabContent />
                </TabsContent>
                <TabsContent value='users'>
                    <UsersTabContent />
                </TabsContent>
            </Tabs>
        </div>
    </div>
  )
}

export default AdminPage