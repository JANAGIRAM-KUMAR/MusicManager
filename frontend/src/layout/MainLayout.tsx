import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Outlet } from "react-router-dom"
import LeftSidebar from "./components/LeftSidebar";
import AudioPlayer from "./components/AudioPlayer";
import PlayBackControls from "./components/PlayBackControls";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react"

const MainLayout = () => {
    const [isMobile, setIsMobile] = useState(false);
    const {isSignedIn} = useAuth();

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);
  return (
    <div className="h-screen bg-black text-white flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1 flex h-full overflow-hidden p-2">
            {isSignedIn && (
                <ResizablePanel defaultSize={20} minSize={isMobile ? 0 : 20} maxSize={30}>
                <LeftSidebar />
                </ResizablePanel>
            )}
     
            <ResizableHandle className="w-2 bg-black rounded-lg transition-colors"/>
            {/* Main layout */}
            <ResizablePanel defaultSize={isMobile ? 80 : 60}>
                <Outlet />
            </ResizablePanel>
            <ResizableHandle className="w-2 bg-black rounded-lg transition-colors"/>
        </ResizablePanelGroup>
        {isSignedIn && <AudioPlayer />}
        {isSignedIn && <PlayBackControls />}
    </div>
  ) 
}

export default MainLayout