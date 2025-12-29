import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton"
import { buttonVariants } from "@/components/ui/button.js"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils.js"
import { useMusicStore } from "../../stores/useMusicStore.js"
import { HomeIcon, LibraryIcon} from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect } from "react"

const LeftSidebar = () => {
    // data fetching using zustand
    const {isLoading, albums, fetchAlbums}= useMusicStore();
    useEffect(() => {
        fetchAlbums();
    },[fetchAlbums]);
    //console.log(albums);
    
  return (
    <div className="h-full flex flex-col gap-2">
        {/* Navigation menu */}
        <div className="rounded-lg bg-zinc-900 p-4">
            <div className="space-y-2">
                <Link to="/" className={cn(buttonVariants(
                    {
                    variant: "ghost",
                    className: "w-full justify-start text-white hover:bg-zinc-800",
                    }
                ))}> 
                <HomeIcon className="size-5 mr-2" />
                <span className="hidden md:inline">Home</span>
                </Link>
            </div>
        </div>

        {/* Library Section */}
        <div className="flex-1 rounded-lg bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-white px-2">
                    <LibraryIcon className="size-5 mr-2" />
                    <span className="hidden md:inline">Playlists</span>
                </div>
            </div>
            <ScrollArea className="h-[calc(100vh - 300px)]">
                <div className="space-y-2">
                    {isLoading ? 
                    (<PlaylistSkeleton />) : 
                    (
                        albums.map((album) => (
                            <Link to={`/albums/${album._id}`} 
                            key={album._id}
                            className="p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer"
                            > 
                            <img src={album.imageUrl} alt="Playlist image" 
                            className="w-12 h-12 rounded-md flex-shrink-0 object-cover" 
                            />
                            <div className="flex-1 min-w-0 hidden md:block">
                                <p className="font-medium truncate">
                                    {album.title}
                                </p>
                                <p className="text-sm text-zinc-400 truncate">
                                    Album ✸ {album.artist}
                                </p>
                            </div>
                            </Link>
                        ))
                    )}
                </div>

            </ScrollArea>

        </div>  
    </div>
  )
}

export default LeftSidebar